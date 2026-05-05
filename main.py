import os
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

# Import our services and constants
from services.gemini_service import (
    generate_initial_image, generate_initial_image_variations, edit_image,
    generate_edit_variations, generate_video_variations, generate_prompt,
    generate_color_palette, generate_moodboard_image, regenerate_color,
    rewrite_prompt, select_best_image, analyze_tech_pack_sketch,
    generate_tech_pack_flat, generate_tech_pack_rendering,
    regenerate_tech_pack_rendering, regenerate_tech_pack_flat,
    generate_annotated_tech_pack, get_region_for_model, VIDEO_MODEL
)
from constants.fabrics import FABRICS

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GCS Storage client
storage_client = storage.Client()
bucket_name = os.environ.get("GCS_BUCKET_NAME", "p2m-accelerator-ufp")
video_folder = os.environ.get("VIDEO_FOLDER", "video_generation")

# Map of available functions in gemini_service
gemini_service_map = {
    "generateInitialImage": generate_initial_image,
    "generateInitialImageVariations": generate_initial_image_variations,
    "editImage": edit_image,
    "generateEditVariations": generate_edit_variations,
    "generateVideoVariations": generate_video_variations,
    "generatePrompt": generate_prompt,
    "generateColorPalette": generate_color_palette,
    "generateMoodboardImage": generate_moodboard_image,
    "regenerateColor": regenerate_color,
    "rewritePrompt": rewrite_prompt,
    "selectBestImage": select_best_image,
    "analyzeTechPackSketch": analyze_tech_pack_sketch,
    "generateTechPackFlat": generate_tech_pack_flat,
    "generateTechPackRendering": generate_tech_pack_rendering,
    "regenerateTechPackRendering": regenerate_tech_pack_rendering,
    "regenerateTechPackFlat": regenerate_tech_pack_flat,
    "generateAnnotatedTechPack": generate_annotated_tech_pack,
}

@app.get("/api/fabrics")
async def get_fabrics():
    return {"fabrics": FABRICS}

@app.post("/api/gemini")
async def rpc_endpoint(request: Request):
    try:
        body = await request.json()
        func_name = body.get("func")
        args = body.get("args", [])

        if not func_name:
            raise HTTPException(status_code=400, detail="Function name is required")

        if func_name not in gemini_service_map:
            raise HTTPException(status_code=400, detail=f"Invalid function name: {func_name}")

        func = gemini_service_map[func_name]
        
        # Execute the function
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
                  # Extract folder and filename from blob name: video_folder/folder/filename.mp4
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
