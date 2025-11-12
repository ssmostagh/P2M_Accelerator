import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality } from '@google/genai';
import { Storage } from '@google-cloud/storage';
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

console.log("--- SERVER.JS HAS BEEN UPDATED ---");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' })); // Increase limit to handle base64 images

// --- Gemini Service Code ---
const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

if (!project) {
    console.error('ERROR: GOOGLE_CLOUD_PROJECT environment variable is not set!');
    console.error('Please ensure your .env file exists and contains:');
    console.error('  GOOGLE_CLOUD_PROJECT=your-project-id');
    console.error('  GOOGLE_CLOUD_LOCATION=us-central1');
    console.error('Current GOOGLE_* environment variables:', Object.keys(process.env).filter(k => k.startsWith('GOOGLE')));
    process.exit(1);
}

console.log(`Using project ID: ${project}`);
console.log(`Using location: ${location}`);
const ai = new GoogleGenAI({
    vertexai: true,
    project: project,
    location: location
});

// Initialize Google Cloud Storage
const storage = new Storage({ project: project });
const bucketName = 'p2m-accelerator-ufp';
const videoFolder = 'video_generation';

// Initialize Google Auth for getting access tokens
const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

const imageEditingModel = 'gemini-2.5-flash-image';
const textVisionModel = 'gemini-2.5-pro'; // For garment description
const videoModel = 'veo-3.1-generate-preview';

const dataUrlToGenerativePart = (dataUrl) => {
    const [header, data] = dataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    return {
        inlineData: { data, mimeType },
    };
};

const processApiResponse = (response) => {
    console.log('========================================');
    console.log('🔍 PROCESSING API RESPONSE');
    console.log('========================================');
    console.log('Response structure:', JSON.stringify(response, null, 2));
    console.log('Response candidates:', response.candidates);

    if (!response.candidates || response.candidates.length === 0) {
        console.error('❌ ERROR: No candidates in response');
        throw new Error('No candidates found in the API response.');
    }

    const parts = response.candidates?.[0]?.content?.parts || [];
    console.log(`Found ${parts.length} parts in response`);

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        console.log(`Checking part ${i + 1}:`, JSON.stringify(part, null, 2));
        if (part.inlineData) {
            const { mimeType, data } = part.inlineData;
            console.log('✅ FOUND IMAGE DATA!');
            console.log('MIME Type:', mimeType);
            console.log('Data length:', data ? data.length : 0);
            return `data:${mimeType};base64,${data}`;
        }
    }
    console.log('❌ ERROR: No image found in any parts');
    throw new Error('No image found in the API response.');
};

const generatePrompt = async (garmentImagePart) => {
    const model = textVisionModel;
    const prompt = `Analyze this garment image and provide a detailed description including:
- Type of garment (e.g., t-shirt, dress, jacket)
- Style and fit (e.g., casual, formal, slim-fit, oversized)
- Color(s) and color patterns
- Fabric texture and material appearance
- Key design features (e.g., collar type, sleeves, pockets, buttons, zippers)
- Any patterns, prints, or graphics
- Overall aesthetic and fashion category

Provide a comprehensive description that would help recreate this garment accurately in a virtual try-on.`;

    const response = await ai.models.generateContent({
        model: model,
        contents: { role: 'user', parts: [ { text: prompt }, garmentImagePart ] },
    });

    return response.text;
};

const generateInitialImage = async (modelImagePart, garmentImagePart, textPart) => {
  console.log('========================================');
  console.log('🎨 GENERATING INITIAL IMAGE');
  console.log('========================================');

  // First, get a detailed description of the garment using Gemini 2.5 Pro
  console.log('📝 Generating garment description with Gemini 2.5 Pro...');
  const garmentDescription = await generatePrompt(garmentImagePart);
  console.log('✅ Garment description:', garmentDescription);

  // Add the garment description to the user prompt instead of using systemInstruction
  // (some image models may not support systemInstruction)
  const enhancedTextPart = {
    text: `Create a highly realistic, photo-quality virtual try-on image showing the person from the model image wearing the garment from the garment image.

GARMENT DETAILS:
${garmentDescription}

CRITICAL REQUIREMENTS:
- Naturally place and fit the garment on the person's body with proper sizing and proportions
- Ensure realistic draping, wrinkles, and fabric behavior based on the garment type and material
- Match lighting, shadows, and highlights to integrate the garment seamlessly with the model
- Preserve the exact colors, patterns, textures, and all design details of the garment
- Maintain the person's original pose, facial features, skin tone, and body proportions exactly
- Keep the background completely unchanged
- Ensure the garment looks like it's actually being worn, not superimposed
- Create natural shadows and depth where the garment interacts with the body
- Make the result indistinguishable from a real photograph`
  };

  console.log('📤 Sending request to image model...');
  const response = await ai.models.generateContent({
    model: imageEditingModel,
    contents: { role: 'user', parts: [modelImagePart, garmentImagePart, enhancedTextPart] },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  console.log('✅ Got response from Gemini API');
  return processApiResponse(response);
};

const generateInitialImageVariations = async (modelImagePart, garmentImagePart, textPart, count = 4) => {
  console.log('========================================');
  console.log('🎨 GENERATING INITIAL IMAGE VARIATIONS');
  console.log(`Generating ${count} variations...`);
  console.log('========================================');

  // First, get a detailed description of the garment using Gemini 2.5 Pro
  console.log('📝 Generating garment description with Gemini 2.5 Pro...');
  const garmentDescription = await generatePrompt(garmentImagePart);
  console.log('✅ Garment description:', garmentDescription);

  // Create enhanced text part with garment description
  const enhancedTextPart = {
    text: `Create a highly realistic, photo-quality virtual try-on image showing the person from the model image wearing the garment from the garment image.

GARMENT DETAILS:
${garmentDescription}

CRITICAL REQUIREMENTS:
- Naturally place and fit the garment on the person's body with proper sizing and proportions
- Ensure realistic draping, wrinkles, and fabric behavior based on the garment type and material
- Match lighting, shadows, and highlights to integrate the garment seamlessly with the model
- Preserve the exact colors, patterns, textures, and all design details of the garment
- Maintain the person's original pose, facial features, skin tone, and body proportions exactly
- Keep the background completely unchanged
- Ensure the garment looks like it's actually being worn, not superimposed
- Create natural shadows and depth where the garment interacts with the body
- Make the result indistinguishable from a real photograph`
  };

  // Generate multiple variations in parallel
  const generationPromises = [];
  for (let i = 0; i < count; i++) {
    console.log(`📤 Starting generation ${i + 1}/${count}...`);
    const promise = ai.models.generateContent({
      model: imageEditingModel,
      contents: { role: 'user', parts: [modelImagePart, garmentImagePart, enhancedTextPart] },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    }).then(response => {
      console.log(`✅ Completed generation ${i + 1}/${count}`);
      return processApiResponse(response);
    });
    generationPromises.push(promise);
  }

  const results = await Promise.all(generationPromises);
  console.log(`✅ All ${count} variations generated successfully`);
  return results;
};

const editImage = async (imagePart, textPart) => {
  const response = await ai.models.generateContent({
    model: imageEditingModel,
    contents: { role: 'user', parts: [imagePart, textPart] },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  return processApiResponse(response);
};

const generateEditVariations = async (baseImage, prompt, count = 3) => {
    const imagePart = dataUrlToGenerativePart(baseImage);
    const textPart = { text: prompt };
    const editPromises = [];
    for (let i = 0; i < count; i++) {
        editPromises.push(editImage(imagePart, textPart));
    }
    const results = await Promise.all(editPromises);
    return results;
};

const uploadVideoToGCS = async (videoBuffer, filename) => {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(`${videoFolder}/${filename}`);

    await file.save(videoBuffer, {
        contentType: 'video/mp4',
        metadata: {
            cacheControl: 'public, max-age=31536000',
        },
    });

    // Generate a signed URL that's valid for 7 days
    const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.log('✅ Generated signed URL valid for 7 days');
    return signedUrl;
};

const generateVideoVariations = async (frontImage, count = 3) => {
    console.log('========================================');
    console.log('🎬 GENERATING VIDEO VARIATIONS');
    console.log(`Generating ${count} video(s)...`);
    console.log('========================================');

    const { inlineData } = dataUrlToGenerativePart(frontImage);

    // Get access token for authentication
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    if (!accessToken.token) {
        throw new Error('Failed to get access token from Google Auth');
    }

    // Prepare the request body with correct Vertex AI structure
    // According to Vertex AI docs: instances array + separate parameters object
    const requestBody = {
        instances: [
            {
                prompt: "Animate the person in the image turning around smoothly, as if on a catwalk, to show the back of their garment. The movement should be natural, smooth, and the background should remain consistent.",
                image: {
                    bytesBase64Encoded: inlineData.data,
                    mimeType: inlineData.mimeType
                }
            }
        ],
        parameters: {
            sampleCount: 1,
            durationSeconds: 4,
            aspectRatio: "16:9",
            resolution: "720p",
            generateAudio: true
        }
    };

    // Make direct HTTP request to Vertex AI API
    const apiEndpoint = `${location}-aiplatform.googleapis.com`;
    const url = `https://${apiEndpoint}/v1/projects/${project}/locations/${location}/publishers/google/models/${videoModel}:predictLongRunning`;

    console.log('📤 Sending request to Vertex AI API...');
    console.log('URL:', url);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken.token}`
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        console.error('Request body was:', JSON.stringify(requestBody, null, 2));
        throw new Error(`Video generation API failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Video generation started:', result);

    // Extract operation name from response
    const operationName = result.name;
    if (!operationName) {
        throw new Error('No operation name returned from API');
    }

    console.log('📝 Full operation name from API:', operationName);

    // The API returns a full operation path that we need to use as-is for status checking
    // We'll return the full path for the frontend to use when polling
    return { name: operationName };
};

const geminiService = {
    generateInitialImage,
    generateInitialImageVariations,
    editImage,
    generateEditVariations,
    generateVideoVariations,
    generatePrompt,
};

// --- API Endpoint ---
app.post('/api/gemini', async (req, res) => {
    const { func, args } = req.body;

    if (!geminiService[func]) {
        return res.status(400).json({ error: 'Invalid function name' });
    }

    try {
        const result = await geminiService[func](...args);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/gemini/operation/:name', async (req, res) => {
    const { name } = req.params;
    const decodedName = decodeURIComponent(name);

    console.log('📨 Received operation status request for:', decodedName);

    try {
        // Get access token for authentication
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        if (!accessToken.token) {
            throw new Error('Failed to get access token from Google Auth');
        }

        // Make direct HTTP request to check operation status
        // The name parameter is the full operation path returned by the API
        // We need to prepend /v1/ to construct the full URL
        const url = `https://${location}-aiplatform.googleapis.com/v1/${decodedName}`;

        console.log('🔍 Checking operation status:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken.token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Operation status error:', errorText);
            throw new Error(`Failed to get operation status: ${response.status} ${response.statusText}`);
        }

        const operation = await response.json();
        console.log('📊 Operation status:', operation.done ? 'DONE' : 'IN PROGRESS');
        console.log('📋 Full operation response:', JSON.stringify(operation, null, 2));

        // If operation is done, try to extract and save videos
        if (operation.done) {
            console.log('✅ Operation completed, checking for videos...');

            // Try to find videos in different possible response structures
            const predictions = operation.response?.predictions ||
                               operation.response?.generatedVideos ||
                               [];

            if (predictions.length > 0) {
                console.log(`📹 Found ${predictions.length} video(s), uploading to GCS bucket: gs://${bucketName}/${videoFolder}/`);

                try {
                    const gcsUrls = await Promise.all(
                        predictions.map(async (prediction, index) => {
                            // Try different possible fields for video URI
                            const downloadLink = prediction?.videoGcsUri ||
                                               prediction?.uri ||
                                               prediction?.video?.uri ||
                                               prediction?.video?.gcsUri;

                            if (!downloadLink) {
                                console.error('❌ No video URI found in prediction:', JSON.stringify(prediction, null, 2));
                                throw new Error(`Video download link is missing for prediction ${index}`);
                            }

                            console.log(`📥 Downloading video ${index + 1}/${predictions.length} from:`, downloadLink);

                            // Download the video from GCS URI
                            const videoResponse = await fetch(downloadLink);
                            if (!videoResponse.ok) {
                                throw new Error(`Failed to download video ${index + 1}: ${videoResponse.statusText}`);
                            }

                            const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
                            console.log(`📦 Downloaded video ${index + 1}, size: ${videoBuffer.length} bytes`);

                            // Generate a unique filename with timestamp
                            const timestamp = Date.now();
                            const filename = `video_${timestamp}_${index}.mp4`;
                            const gcsPath = `gs://${bucketName}/${videoFolder}/${filename}`;

                            // Upload to our GCS bucket with signed URL
                            const gcsUrl = await uploadVideoToGCS(videoBuffer, filename);
                            console.log(`✅ Uploaded video ${index + 1} to GCS:`);
                            console.log(`   Path: ${gcsPath}`);
                            console.log(`   Signed URL: ${gcsUrl.substring(0, 100)}...`);

                            return gcsUrl;
                        })
                    );

                    console.log(`🎉 Successfully saved all ${gcsUrls.length} video(s) to GCS bucket!`);

                    // Return operation with GCS URLs in the format expected by frontend
                    const modifiedOperation = {
                        ...operation,
                        response: {
                            ...operation.response,
                            generatedVideos: gcsUrls.map(url => ({ video: { uri: url } }))
                        }
                    };

                    res.json(modifiedOperation);
                } catch (saveError) {
                    console.error('❌ Error saving videos to GCS:', saveError);
                    // Still return the operation even if save fails, so frontend knows it completed
                    res.json({
                        ...operation,
                        saveError: saveError.message
                    });
                }
            } else {
                console.log('⚠️  Operation done but no videos found in response');
                console.log('📋 Response structure:', JSON.stringify(operation.response, null, 2));
                res.json(operation);
            }
        } else {
            // Operation still in progress
            res.json(operation);
        }
    } catch (error) {
        console.error('Error fetching operation status:', error);
        res.status(500).json({ error: 'Failed to fetch operation status.' });
    }
});

// Endpoint to list all videos in GCS bucket
app.get('/api/videos/list', async (req, res) => {
    try {
        const bucket = storage.bucket(bucketName);
        const [files] = await bucket.getFiles({
            prefix: videoFolder + '/',
        });

        const videos = await Promise.all(
            files
                .filter(file => file.name.endsWith('.mp4'))
                .map(async (file) => {
                    const [signedUrl] = await file.getSignedUrl({
                        version: 'v4',
                        action: 'read',
                        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
                    });

                    return {
                        name: file.name,
                        size: file.metadata.size,
                        created: file.metadata.timeCreated,
                        url: signedUrl,
                        gcsPath: `gs://${bucketName}/${file.name}`
                    };
                })
        );

        console.log(`📋 Listed ${videos.length} video(s) from GCS bucket: gs://${bucketName}/${videoFolder}/`);
        res.json({
            bucket: `gs://${bucketName}/${videoFolder}/`,
            count: videos.length,
            videos: videos
        });
    } catch (error) {
        console.error('Error listing videos from GCS:', error);
        res.status(500).json({ error: 'Failed to list videos from GCS bucket.' });
    }
});

app.use(express.static('dist'));

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server is running on ${HOST}:${PORT}`);
});
