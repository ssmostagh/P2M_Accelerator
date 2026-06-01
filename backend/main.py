import os
from dotenv import load_dotenv
load_dotenv()

import base64
import urllib.parse
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import google.auth
import google.auth.transport.requests
from google.cloud import storage

# Import base service constants/helpers
from services.base_service import get_region_for_model, VIDEO_MODEL

# Import domain services
import services.studio_service as studio_service
import services.moodboard_service as moodboard_service
import services.tech_pack_service as tech_pack_service

# Import routers
from routers import studio, moodboard, tech_pack
from constants.fabrics import FABRICS

app = FastAPI(title="P2M Accelerator API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(studio.router, prefix="/api/studio", tags=["Studio"])
app.include_router(moodboard.router, prefix="/api/moodboard", tags=["Moodboard"])
app.include_router(tech_pack.router, prefix="/api/tech_pack", tags=["TechPack"])

# GCS Storage client
storage_client = storage.Client()
bucket_name = os.environ.get("GCS_BUCKET_NAME", "p2m-accelerator-ufp")
video_folder = os.environ.get("VIDEO_FOLDER", "video_generation")

# Legacy backward-compatibility map for RPC-style frontend requests
gemini_service_map = {
    # Studio / Try-on / VTO
    "generatePrompt": studio_service.generate_prompt,
    "generateInitialImage": studio_service.generate_initial_image,
    "generateInitialImageVariations": studio_service.generate_initial_image_variations,
    "editImage": studio_service.edit_image,
    "generateEditVariations": studio_service.generate_edit_variations,
    "generateVideoVariations": studio_service.generate_video_variations,
    "selectBestImage": studio_service.select_best_image,
    
    # Moodboard
    "generateColorPalette": moodboard_service.generate_color_palette,
    "generateMoodboardImage": moodboard_service.generate_moodboard_image,
    "regenerateColor": moodboard_service.regenerate_color,
    "rewritePrompt": moodboard_service.rewrite_prompt,
    
    # Tech Pack
    "analyzeTechPackSketch": tech_pack_service.analyze_tech_pack_sketch,
    "generateTechPackFlat": tech_pack_service.generate_tech_pack_flat,
    "generateTechPackRendering": tech_pack_service.generate_tech_pack_rendering,
    "regenerateTechPackRendering": tech_pack_service.regenerate_tech_pack_rendering,
    "regenerateTechPackFlat": tech_pack_service.regenerate_tech_pack_flat,
    "generateAnnotatedTechPack": tech_pack_service.generate_annotated_tech_pack,
}

@app.get("/api/fabrics")
async def get_fabrics():
    return {"fabrics": FABRICS}

@app.post("/api/gemini")
async def rpc_endpoint(request: Request):
    """
    Legacy RPC endpoint to ensure perfect backward compatibility with the 
    existing frontend calling convention without requiring frontend refactoring.
    """
    try:
        body = await request.json()
        func_name = body.get("func")
        args = body.get("args", [])

        if not func_name:
            raise HTTPException(status_code=400, detail="Function name is required")

        if func_name not in gemini_service_map:
            raise HTTPException(status_code=400, detail=f"Invalid function name: {func_name}")

        func = gemini_service_map[func_name]
        
        # Execute the refactored modular function
        result = await func(*args)
        return result

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"API Error in /api/gemini: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "details": "Error in Python backend"}
        )

@app.get("/api/gemini/operation/{name:path}")
async def get_operation_status(name: str):
    decoded_name = urllib.parse.unquote(name)
    print(f"📨 Status request for op: {decoded_name}")

    try:
        model_region = get_region_for_model(VIDEO_MODEL)
        project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")

        credentials, _ = google.auth.default()
        auth_request = google.auth.transport.requests.Request()
        credentials.refresh(auth_request)

        url = f"https://{model_region}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{model_region}/publishers/google/models/{VIDEO_MODEL}:fetchPredictOperation"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {credentials.token}"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json={"operationName": decoded_name})
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=f"API failed: {response.text}")
            
            operation = response.json()
            is_done = operation.get("done", False)

            normalized = {
                "name": operation.get("name") or decoded_name,
                "done": is_done,
                "response": operation.get("response")
            }

            if is_done:
                videos = operation.get("response", {}).get("videos", [])
                if videos:
                    gcs_urls = []
                    for i, video in enumerate(videos):
                        gcs_uri = video.get("gcsUri")
                        if gcs_uri:
                            parts = gcs_uri.replace(f"gs://{bucket_name}/{video_folder}/", "").split("/")
                            if len(parts) >= 2:
                                folder = parts[-2] # Op ID folder
                                filename = parts[-1]
                                gcs_urls.append(f"/api/videos/stream/{folder}/{filename}")
                        elif "bytesBase64Encoded" in video:
                            base64_data = video["bytesBase64Encoded"]
                            try:
                                video_bytes = base64.b64decode(base64_data)
                                op_id = decoded_name.split('/')[-1]
                                folder = op_id
                                filename = f"video_{i}.mp4"
                                
                                bucket = storage_client.bucket(bucket_name)
                                blob = bucket.blob(f"{video_folder}/{folder}/{filename}")
                                blob.upload_from_string(video_bytes, content_type="video/mp4")
                                
                                gcs_urls.append(f"/api/videos/stream/{folder}/{filename}")
                                print(f"Uploaded base64 video to GCS: {video_folder}/{folder}/{filename}", flush=True)
                            except Exception as e:
                                print(f"Failed to decode or upload base64 video: {e}", flush=True)
                     
                    normalized["response"]["generatedVideos"] = [{"video": {"uri": url}} for url in gcs_urls]

            return normalized

    except Exception as e:
        print(f"Error fetching operation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/videos/stream/{folder}/{filename}")
async def stream_video(folder: str, filename: str):
    try:
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(f"{video_folder}/{folder}/{filename}")

        if not blob.exists():
            raise HTTPException(status_code=404, detail="Video not found")

        def iter_file():
             with blob.open("rb") as f:
                  while True:
                       chunk = f.read(1024 * 1024)
                       if not chunk:
                            break
                       yield chunk

        blob.reload()
        return StreamingResponse(
             iter_file(),
             media_type=blob.content_type or "video/mp4",
             headers={"Accept-Ranges": "bytes", "Content-Length": str(blob.size)}
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error streaming video: {e}")
        raise HTTPException(status_code=500, detail="Failed to stream video")

@app.get("/api/videos/list")
async def list_videos():
    try:
        bucket = storage_client.bucket(bucket_name)
        blobs = bucket.list_blobs(prefix=f"{video_folder}/")

        videos = []
        for blob in blobs:
             if blob.name.endswith(".mp4"):
                  parts = blob.name.replace(f"{video_folder}/", "").split("/")
                  if len(parts) >= 2:
                       folder = parts[0]
                       filename = parts[1]
                       videos.append({
                             "name": blob.name,
                             "size": blob.size,
                             "created": blob.time_created.isoformat() if blob.time_created else None,
                             "url": f"/api/videos/stream/{folder}/{filename}"
                       })
        return videos

    except Exception as e:
         print(f"Error listing videos: {e}")
         raise HTTPException(status_code=500, detail="Failed to list videos")
