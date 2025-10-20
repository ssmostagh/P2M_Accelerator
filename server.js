import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import { GoogleGenAI, Modality } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' })); // Increase limit to handle base64 images

// --- Gemini Service Code ---
const ai = new GoogleGenAI({ project: 'cpg-cdp', vertexai: true });

const imageEditingModel = 'gemini-2.5-flash-image';
const videoModel = 'veo-2.0-generate-001';

const dataUrlToGenerativePart = (dataUrl) => {
    const [header, data] = dataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    return {
        inlineData: { data, mimeType },
    };
};

const processApiResponse = (response) => {
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            const { mimeType, data } = part.inlineData;
            return `data:${mimeType};base64,${data}`;
        }
    }
    throw new Error('No image found in the API response.');
};

const generateInitialImage = async (modelImage, garmentImage) => {
  const modelImagePart = dataUrlToGenerativePart(modelImage);
  const garmentImagePart = dataUrlToGenerativePart(garmentImage);
  const textPart = { text: `Using the person from the first image and the garment from the second image, create a photorealistic virtual try-on. The garment should be placed on the person, fitting them naturally. Maintain the style of the garment and the person\'s pose and background from the first image.` };

  const response = await ai.models.generateContent({
    model: imageEditingModel, // Use the image editing model
    contents: { role: 'user', parts: [modelImagePart, garmentImagePart, textPart] },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  return processApiResponse(response);
};

const editImage = async (baseImage, prompt) => {
  const imagePart = dataUrlToGenerativePart(baseImage);
  const textPart = { text: prompt };

  const response = await ai.models.generateContent({
    model: imageEditingModel, // Use the image editing model
    contents: { role: 'user', parts: [imagePart, textPart] },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  return processApiResponse(response);
};

const generateEditVariations = async (baseImage, prompt, count = 3) => {
    const editPromises = [];
    for (let i = 0; i < count; i++) {
        editPromises.push(editImage(baseImage, prompt));
    }
    const results = await Promise.all(editPromises);
    return results;
};

const generateVideoVariations = async (frontImage, count = 3) => {
    const { inlineData } = dataUrlToGenerativePart(frontImage);

    let operation = await ai.models.generateVideos({
        model: videoModel,
        prompt: "Animate the person in the image turning around smoothly, as if on a catwalk, to show the back of their garment. The movement should be natural and the background should remain consistent.",
        image: {
            imageBytes: inlineData.data,
            mimeType: inlineData.mimeType,
        },
        config: {
            numberOfVideos: count,
            aspectRatio: '9:16',
        },
    });

    // The client will have to poll for the status.
    return operation;
};

const geminiService = {
    generateInitialImage,
    editImage,
    generateEditVariations,
    generateVideoVariations,
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

    try {
        // This is a simplified representation. The actual method to get operation
        // status might be different. We are assuming `ai.operations.get` exists
        // and works as expected based on the Vertex AI API patterns.
        // In a real-world scenario, you would need to consult the specific
        // documentation for the library version you are using.
        const operation = await ai.operations.get({ name: `operations/${name}` });
        res.json(operation);
    } catch (error) {
        console.error('Error fetching operation status:', error);
        res.status(500).json({ error: 'Failed to fetch operation status.' });
    }
});


app.use(express.static('dist'));

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(__dirname + '/dist/index.html');
});

app.listen(process.env.PORT || 8080, () => {
  console.log('Server is running on port 8080');
});
