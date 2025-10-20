
import { GoogleGenAI, Modality, GenerateContentResponse } from '@google/genai';

// When running on Google Cloud, the project and credentials will be
// inferred from the environment.
const ai = new GoogleGenAI({ vertexai: true });

const imageModel = 'gemini-2.5-flash-image';
const videoModel = 'veo-2.0-generate-001';

// Helper to convert File object to a base64 string with MIME type
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

// Helper to convert a base64 data URL to a generative part
const dataUrlToGenerativePart = (dataUrl: string) => {
    const [header, data] = dataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    return {
        inlineData: { data, mimeType },
    };
};


const processApiResponse = (response: GenerateContentResponse): string => {
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            const { mimeType, data } = part.inlineData;
            return `data:${mimeType};base64,${data}`;
        }
    }
    throw new Error('No image found in the API response.');
};

export const generateInitialImage = async (modelImage: File, garmentImage: File): Promise<string> => {
  const modelImagePart = await fileToGenerativePart(modelImage);
  const garmentImagePart = await fileToGenerativePart(garmentImage);
  const textPart = { text: `Using the person from the first image and the garment from the second image, create a photorealistic virtual try-on. The garment should be placed on the person, fitting them naturally. Maintain the style of the garment and the person's pose and background from the first image.` };

  const response = await ai.models.generateContent({
    model: imageModel,
    contents: { role: 'user', parts: [modelImagePart, garmentImagePart, textPart] },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  return processApiResponse(response);
};

export const editImage = async (baseImage: string, prompt: string): Promise<string> => {
  const imagePart = dataUrlToGenerativePart(baseImage);
  const textPart = { text: prompt };

  const response = await ai.models.generateContent({
    model: imageModel,
    contents: { role: 'user', parts: [imagePart, textPart] },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  return processApiResponse(response);
};

export const generateEditVariations = async (baseImage: string, prompt: string, count: number = 3): Promise<string[]> => {
    const editPromises: Promise<string>[] = [];
    for (let i = 0; i < count; i++) {
        editPromises.push(editImage(baseImage, prompt));
    }
    const results = await Promise.all(editPromises);
    return results;
};

const videoGenerationMessages = [
    "Warming up the video generators...",
    "Composing initial frames for variations...",
    "Animating the model's turn...",
    "Rendering fabric details in motion...",
    "This can take a few minutes, please wait...",
    "Almost there, adding final touches to videos...",
];

export const generateVideoVariations = async (frontImage: string, onStatusUpdate: (status: string) => void, count: number = 3): Promise<string[]> => {
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

    let messageIndex = 0;
    onStatusUpdate(videoGenerationMessages[messageIndex]);
    const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % videoGenerationMessages.length;
        onStatusUpdate(videoGenerationMessages[messageIndex]);
    }, 8000);

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    clearInterval(interval);
    onStatusUpdate("Video processing complete!");

    const generatedVideos = operation.response?.generatedVideos;
    if (!generatedVideos || generatedVideos.length === 0) {
        throw new Error("Video generation finished, but no videos were found.");
    }

    const videoUrlPromises = generatedVideos.map(async (video) => {
        const downloadLink = video?.video?.uri;
        if (!downloadLink) {
            throw new Error("A video was generated, but its download link is missing.");
        }
        // The download link is a signed URL that is accessible by the service account.
        // No API key is needed.
        const response = await fetch(downloadLink);
        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.statusText}`);
        }
        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);
    });

    return Promise.all(videoUrlPromises);
};
