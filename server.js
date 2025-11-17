import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality } from '@google/genai';
import { Storage } from '@google-cloud/storage';
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';
import { PANTONE_COLORS, getRandomPantoneColors, getComplementaryPantoneColors } from './constants/pantoneColors.js';

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
const bucketName = process.env.GCS_BUCKET_NAME || 'p2m-accelerator-ufp';
const videoFolder = process.env.GCS_VIDEO_FOLDER || 'video_generation';

console.log(`Using GCS bucket: gs://${bucketName}/${videoFolder}/`);

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

const analyzeTechPackSketch = async (sketchImagePart) => {
    console.log('========================================');
    console.log('🔍 ANALYZING TECH ILLUSTRATION SKETCH');
    console.log('========================================');

    const model = textVisionModel;
    const prompt = `Analyze this fashion design sketch and provide a detailed technical description including:

GARMENT IDENTIFICATION:
- Type of garment (e.g., t-shirt, dress, jacket, pants, skirt)
- Overall aesthetic and fashion category

PROPORTIONS AND MEASUREMENTS (CRITICAL - be specific):
- Overall garment length (where it falls on the body: above knee, knee-length, midi, floor-length, etc.)
- Body width at bust/chest, waist, and hips (fitted, loose, oversized)
- Shoulder width and slope
- Armhole depth and placement
- Sleeve length (sleeveless, cap, short, 3/4, long)
- Sleeve width (fitted, regular, wide, balloon, etc.)
- Waistline placement (natural waist, dropped waist, empire, etc.)
- Hemline shape and curve (straight, curved, asymmetric, tiered)

SILHOUETTE AND FIT:
- Overall silhouette (A-line, fitted, shift, mermaid, etc.)
- Fit type (body-hugging, relaxed, oversized, tailored)
- How the garment drapes or stands away from the body

CONSTRUCTION DETAILS:
- Neckline/collar type and exact shape
- Closure type, placement, and number (buttons, zippers, ties, lacing)
- Seam lines and their exact placement
- Darts, pleats, gathers, or tucks (location and direction)
- Yokes, panels, or color blocking
- Topstitching and decorative stitching

DESIGN ELEMENTS:
- Pockets: type, number, exact placement, and size
- Decorative elements or embellishments (where and what type)
- Ruffles, frills, or trim (location and style)
- Special features (cut-outs, slits, overlays)

Provide a comprehensive, measurement-focused technical description that ensures consistency between front and back views. Be specific about lengths, widths, and placement of all elements.`;

    console.log('📤 Sending sketch to Gemini 2.5 Pro for analysis...');
    const response = await ai.models.generateContent({
        model: model,
        contents: { role: 'user', parts: [ { text: prompt }, sketchImagePart ] },
    });

    console.log('✅ Sketch analysis complete');
    console.log('📝 Description:', response.text);
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
            storageUri: `gs://${bucketName}/${videoFolder}/`,
            sampleCount: 4,
            durationSeconds: 6,
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

// --- Moodboard Functions ---
const generateColorPalette = async (title, keywords) => {
    console.log('🎨 Generating color palette from real Pantone colors');
    console.log(`Theme: ${title}`);
    console.log(`Keywords: ${keywords}`);

    // Get complementary Pantone colors based on keywords
    const colors = getComplementaryPantoneColors(keywords, 8);

    // If we didn't get enough colors from keyword matching, fill with random ones
    if (colors.length < 8) {
        const needed = 8 - colors.length;
        const random = getRandomPantoneColors(needed + 10); // Get extra to avoid duplicates
        const existingCodes = new Set(colors.map(c => c.code));

        for (const color of random) {
            if (!existingCodes.has(color.code) && colors.length < 8) {
                colors.push(color);
                existingCodes.add(color.code);
            }
        }
    }

    console.log(`✅ Selected ${colors.length} real Pantone colors`);

    return { colors: colors.slice(0, 8) };
};

const generateMoodboardImage = async (prompt, aspectRatio) => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes = response.generatedImages[0]?.image?.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
        throw new Error("No image was generated.");
    }
};

const regenerateColor = async (currentColorName, themePrompt, direction) => {
    console.log('🔄 Regenerating color from real Pantone colors');
    console.log(`Current color: ${currentColorName}`);
    console.log(`Direction: ${direction || 'random'}`);
    console.log(`Theme: ${themePrompt}`);

    // Find the current color to get its hex value
    const currentColor = PANTONE_COLORS.find(c => c.name === currentColorName);

    // Get a different color from the Pantone database
    let availableColors = PANTONE_COLORS.filter(color => color.name !== currentColorName);

    // If direction is specified, filter by the requested attribute
    if (direction && currentColor) {
        const currentHex = currentColor.code.toLowerCase();
        const currentR = parseInt(currentHex.substring(1, 3), 16);
        const currentG = parseInt(currentHex.substring(3, 5), 16);
        const currentB = parseInt(currentHex.substring(5, 7), 16);
        // Calculate perceived brightness (using standard formula)
        const currentBrightness = (currentR * 299 + currentG * 587 + currentB * 114) / 1000;

        availableColors = availableColors.filter(color => {
            const hex = color.code.toLowerCase();
            const r = parseInt(hex.substring(1, 3), 16);
            const g = parseInt(hex.substring(3, 5), 16);
            const b = parseInt(hex.substring(5, 7), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;

            if (direction === 'lighter') {
                return brightness > currentBrightness + 20; // At least 20 points brighter
            } else if (direction === 'darker') {
                return brightness < currentBrightness - 20; // At least 20 points darker
            } else if (direction === 'warmer') {
                // Warmer = more red/yellow (higher R, higher R relative to B)
                const currentWarmth = currentR - currentB;
                const warmth = r - b;
                return warmth > currentWarmth + 15; // At least 15 points warmer
            } else if (direction === 'cooler') {
                // Cooler = more blue/green (higher B relative to R)
                const currentCoolness = currentB - currentR;
                const coolness = b - r;
                return coolness > currentCoolness + 15; // At least 15 points cooler
            }
            return true;
        });

        console.log(`Filtered to ${availableColors.length} ${direction} colors`);
    }

    // Smart color selection based on theme and direction
    let newColor;

    if (themePrompt && themePrompt.length > 10 && availableColors.length > 0) {
        // Extract keywords from theme prompt (look for quoted text after "theme" or "keywords")
        const keywordMatch = themePrompt.match(/keywords[:\s]+['"](.*?)['"]/i);
        const themeMatch = themePrompt.match(/theme[:\s]+['"](.*?)['"]/i);

        if (keywordMatch || themeMatch) {
            const keywords = keywordMatch ? keywordMatch[1] : themeMatch[1];
            console.log(`Using keywords for color selection: ${keywords}`);

            // Get complementary colors and pick one that's different from current and matches direction
            const complementaryColors = getComplementaryPantoneColors(keywords, 20)
                .filter(color => {
                    // Must not be the current color
                    if (color.name === currentColorName) return false;

                    // Must be in the availableColors (respects direction filter)
                    return availableColors.some(ac => ac.code === color.code);
                });

            if (complementaryColors.length > 0) {
                newColor = complementaryColors[Math.floor(Math.random() * complementaryColors.length)];
                console.log(`🎯 Smart regenerate: Selected theme-appropriate ${direction || 'complementary'} color`);
            }
        }
    }

    // If no direction specified (smart regenerate), prefer theme-appropriate colors
    if (!newColor && !direction && themePrompt && availableColors.length > 0) {
        console.log('🧠 Smart regenerate mode: Finding theme-appropriate alternative');
        // Use theme keywords to find better color
        const keywordMatch = themePrompt.match(/keywords[:\s]+['"](.*?)['"]/i) || themePrompt.match(/theme[:\s]+['"](.*?)['"]/i);
        if (keywordMatch) {
            const keywords = keywordMatch[1];
            const smartColors = getComplementaryPantoneColors(keywords, 15)
                .filter(c => c.name !== currentColorName);

            if (smartColors.length > 0) {
                newColor = smartColors[Math.floor(Math.random() * smartColors.length)];
                console.log('✨ Smart pick: theme-matching color');
            }
        }
    }

    // Fallback to random color from available colors
    if (!newColor && availableColors.length > 0) {
        newColor = availableColors[Math.floor(Math.random() * availableColors.length)];
    }

    // If still no color (e.g., all colors are darker and we asked for lighter), pick any different color
    if (!newColor) {
        const fallbackColors = PANTONE_COLORS.filter(color => color.name !== currentColorName);
        newColor = fallbackColors[Math.floor(Math.random() * fallbackColors.length)];
        console.log('⚠️ Could not find color in requested direction, using fallback');
    }

    console.log(`✅ Selected new Pantone color: ${newColor.name}`);

    return newColor;
};

const rewritePrompt = async (originalPrompt) => {
    const metaPrompt = `You are a creative assistant for a fashion designer. Rewrite and enhance the following image prompt to generate a more visually compelling and detailed photograph for a fashion moodboard. Keep the core concepts but add artistic details. Return only the new prompt text, without any surrounding quotes or explanations. Prompt to rewrite: "${originalPrompt}"`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { role: 'user', parts: [{ text: metaPrompt }] },
    });

    return response.text.trim();
};

// Tech Illustration Assistant Functions
const generateTechPackAssets = async (frontImageDataUrl, backImageDataUrl = null, frontIncludesBack = false, frontDescription = null, backDescription = null) => {
    try {
        console.log('========================================');
        console.log('🎨 GENERATING TECH ILLUSTRATION ASSETS');
        console.log('========================================');
        console.log('Front includes back:', frontIncludesBack);
        console.log('Separate back image provided:', !!backImageDataUrl);
        console.log('Front description available:', !!frontDescription);
        console.log('Back description available:', !!backDescription);

        const model = imageEditingModel; // Use the same model as other image operations
        console.log('Using model:', model);

        // Convert data URLs to image parts
        let frontImagePart, backImagePart;
        try {
            frontImagePart = dataUrlToGenerativePart(frontImageDataUrl);
            console.log('✅ Front image converted successfully');
            backImagePart = backImageDataUrl ? dataUrlToGenerativePart(backImageDataUrl) : null;
            if (backImageDataUrl) {
                console.log('✅ Back image converted successfully');
            }
        } catch (error) {
            console.error('❌ Error converting images to parts:', error);
            throw new Error(`Failed to process uploaded images: ${error.message}`);
        }

        // Build garment context from descriptions
        const frontContext = frontDescription
            ? `\n\nDETAILED GARMENT ANALYSIS (Front View):\n${frontDescription}\n\nUse this analysis to ensure accuracy in the generated output.`
            : '';

        const backContext = backDescription
            ? `\n\nDETAILED GARMENT ANALYSIS (Back View):\n${backDescription}\n\nUse this analysis to ensure accuracy in the generated output.`
            : frontContext; // Use front context if back description not available

        const commonRenderingSuffix = "The garment should be displayed on a neutral, ghost mannequin against a clean, light gray studio background. Focus on realistic fabric texture, drape, and professional lighting. Do not include any text or watermarks.";

        // Enhanced consistency instructions for matching front and back views
        const consistencyRequirements = "\n\nCRITICAL CONSISTENCY REQUIREMENTS: The front and back views MUST represent the SAME garment and maintain perfect consistency in: 1) Overall garment length (shoulder to hem must match) 2) Width and silhouette proportions 3) Sleeve length, style, and width 4) Waistline placement and shape 5) Hemline shape and level 6) Design details like pleats, gathers, or ruffles 7) Fabric weight and drape characteristics 8) Construction method and seam placement. The front and back views should look like they could be sewn together to create one cohesive garment.";

        const commonFlatSuffix = "CRITICAL: This must be a technical flat illustration suitable for factory production. ABSOLUTE REQUIREMENTS: 1) ONLY thin black lines/outlines on pure white background - NO GREY TONES WHATSOEVER 2) ZERO fills, ZERO colors, ZERO shading, ZERO textures, ZERO gradients - everything must be white inside except for detail lines 3) Show seam lines, stitching, topstitching, darts, pleats, pockets, and all construction details ONLY as thin black outlines 4) The garment should be laid completely flat as if viewed from directly above on a table 5) If you need to show pattern or texture details, use ONLY thin outline patterns, never solid fills 6) Think of this as a technical blueprint/line drawing for manufacturers - like a coloring book page that hasn't been colored in yet 7) NO SOLID BLACK AREAS - if a garment piece is dark in the sketch, show it with outline only";


        const commonConfig = { responseModalities: [Modality.IMAGE, Modality.TEXT] };
        const imagePartForBackPrompts = backImagePart ?? frontImagePart;

        // Combined image generation (front AND back in single images)
        const combinedContext = frontDescription && backDescription
            ? `\n\nFRONT VIEW ANALYSIS:\n${frontDescription}\n\nBACK VIEW ANALYSIS:\n${backDescription}`
            : frontDescription || '';

        const renderingCombinedPrompt = `Generate ONE image showing BOTH front AND back photorealistic renderings side by side. Front view on LEFT, back view on RIGHT, with small gap. Both same size, aligned. ${commonRenderingSuffix}${consistencyRequirements}${combinedContext}`;

        const flatCombinedPrompt = `Generate ONE technical flat showing BOTH front AND back views side by side. Front on LEFT, back on RIGHT, small gap. Both same size, aligned. ${commonFlatSuffix}${consistencyRequirements}${combinedContext}`;

        console.log('📸 Starting generation of 2 combined images...');
        console.log('   - Combined Rendering (Front + Back)');
        console.log('   - Combined Technical Flat (Front + Back)');

        let renderingCombinedResult, flatCombinedResult;
        try {
            [renderingCombinedResult, flatCombinedResult] = await Promise.all([
                ai.models.generateContent({ model, contents: { role: 'user', parts: [imagePartForBackPrompts, { text: renderingCombinedPrompt }] }, config: commonConfig }),
                ai.models.generateContent({ model, contents: { role: 'user', parts: [imagePartForBackPrompts, { text: flatCombinedPrompt }] }, config: commonConfig })
            ]);
            console.log('✅ Both API calls completed successfully');
        } catch (error) {
            console.error('❌ Error during image generation API calls:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            throw new Error(`AI generation failed: ${error.message}`);
        }

        console.log('🔄 Processing API responses...');
        let renderingCombined, flatCombined;
        try {
            renderingCombined = processApiResponse(renderingCombinedResult);
            console.log('✅ Combined Rendering (Front + Back) processed');
            flatCombined = processApiResponse(flatCombinedResult);
            console.log('✅ Combined Technical Flat (Front + Back) processed');
        } catch (error) {
            console.error('❌ Error processing API responses:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
            throw new Error(`Failed to process generated images: ${error.message}`);
        }

        console.log('========================================');
        console.log('✅ TECH PACK GENERATION COMPLETE (2 combined images)');
        console.log('========================================');

        return { renderingCombined, flatCombined };
    } catch (error) {
        console.error('========================================');
        console.error('❌ TECH PACK GENERATION FAILED');
        console.error('========================================');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        throw error;
    }
};

const geminiService = {
    generateInitialImage,
    generateInitialImageVariations,
    editImage,
    generateEditVariations,
    generateVideoVariations,
    generatePrompt,
    // Moodboard functions
    generateColorPalette,
    generateMoodboardImage,
    regenerateColor,
    rewritePrompt,
    // Tech Illustration functions
    analyzeTechPackSketch,
    generateTechPackAssets,
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
        // For Veo operations, use fetchPredictOperation endpoint with POST
        // Operation name format: projects/.../publishers/google/models/veo-3.1-generate-preview/operations/{id}
        const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${videoModel}:fetchPredictOperation`;

        console.log('🔍 Checking operation status with fetchPredictOperation');
        console.log('📝 Operation name:', decodedName);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken.token}`
            },
            body: JSON.stringify({
                operationName: decodedName
            })
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
            // Veo response format: operation.response.videos[{gcsUri, mimeType}]
            const videos = operation.response?.videos ||
                          operation.response?.predictions ||
                          operation.response?.generatedVideos ||
                          [];

            if (videos.length > 0) {
                console.log(`📹 Found ${videos.length} video(s) already in GCS bucket: gs://${bucketName}/${videoFolder}/`);

                try {
                    const gcsUrls = await Promise.all(
                        videos.map(async (video, index) => {
                            // Try different possible fields for video URI
                            // Veo format: video.gcsUri (points to our bucket since we set storageUri)
                            const gcsUri = video?.gcsUri ||
                                          video?.videoGcsUri ||
                                          video?.uri ||
                                          video?.video?.uri ||
                                          video?.video?.gcsUri;

                            if (!gcsUri) {
                                console.error('❌ No video URI found in video object:', JSON.stringify(video, null, 2));
                                console.error('📋 Full videos array:', JSON.stringify(videos, null, 2));
                                console.error('📋 All response keys:', Object.keys(operation.response || {}));
                                throw new Error(`Video GCS URI missing for video ${index}`);
                            }

                            console.log(`✅ Video ${index + 1}/${videos.length} saved at: ${gcsUri}`);

                            // Extract folder and filename from GCS URI: gs://bucket/folder/subfolder/filename.mp4
                            // GCS URI format: gs://p2m-accelerator-ufp/video_generation/9464644098597267599/sample_0.mp4
                            const pathParts = gcsUri.replace(`gs://${bucketName}/${videoFolder}/`, '').split('/');
                            const folder = pathParts[0]; // timestamp folder
                            const filename = pathParts[1]; // sample_0.mp4

                            // Return proxy URL instead of signed URL (avoids IAM permission issues)
                            const proxyUrl = `/api/videos/stream/${folder}/${filename}`;

                            console.log(`🔗 Created proxy URL for video ${index + 1}`);
                            console.log(`   GCS Path: ${gcsUri}`);
                            console.log(`   Proxy URL: ${proxyUrl}`);

                            return proxyUrl;
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

// Endpoint to stream a video from GCS (proxy to avoid signed URL issues)
app.get('/api/videos/stream/:folder/:filename', async (req, res) => {
    try {
        const { folder, filename } = req.params;
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(`${videoFolder}/${folder}/${filename}`);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            return res.status(404).json({ error: 'Video not found' });
        }

        // Get file metadata for content type and size
        const [metadata] = await file.getMetadata();

        res.setHeader('Content-Type', metadata.contentType || 'video/mp4');
        res.setHeader('Content-Length', metadata.size);
        res.setHeader('Accept-Ranges', 'bytes');

        // Stream the file directly to response
        file.createReadStream()
            .on('error', (err) => {
                console.error('Error streaming video:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to stream video' });
                }
            })
            .pipe(res);
    } catch (error) {
        console.error('Error in video stream endpoint:', error);
        res.status(500).json({ error: 'Failed to stream video' });
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
