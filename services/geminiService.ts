

// When running on Google Cloud, the project and credentials will be
// inferred from the environment.

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

export const generatePrompt = async (garmentImage: File): Promise<string> => {
  const garmentImagePart = await fileToGenerativePart(garmentImage);

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ func: 'generatePrompt', args: [garmentImagePart] }),
  });

  if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate prompt.');
  }

  const result = await response.json();
  return result;
};

// Helper to convert a base64 data URL to a generative part
const dataUrlToGenerativePart = (dataUrl: string) => {
    const [header, data] = dataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    return {
        inlineData: { data, mimeType },
    };
};



export const generateInitialImage = async (modelImage: File, garmentImage: File, prompt: string): Promise<string> => {
  const modelImagePart = await fileToGenerativePart(modelImage);
  const garmentImagePart = await fileToGenerativePart(garmentImage);
  const textPart = { text: prompt };

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ func: 'generateInitialImage', args: [modelImagePart, garmentImagePart, textPart] }),
  });

  if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate initial image.');
  }

  const result = await response.json();
  return result;
};

export const generateInitialImageVariations = async (modelImage: File, garmentImage: File, prompt: string, count: number = 4): Promise<string[]> => {
  const modelImagePart = await fileToGenerativePart(modelImage);
  const garmentImagePart = await fileToGenerativePart(garmentImage);
  const textPart = { text: prompt };

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ func: 'generateInitialImageVariations', args: [modelImagePart, garmentImagePart, textPart, count] }),
  });

  if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate initial image variations.');
  }

  const result = await response.json();
  return result;
};

export const editImage = async (baseImage: string, prompt: string): Promise<string> => {
  const imagePart = dataUrlToGenerativePart(baseImage);
  const textPart = { text: prompt };

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ func: 'editImage', args: [imagePart, textPart] }),
  });

  if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to edit image.');
  }

  const result = await response.json();
  return result;
};

export const generateEditVariations = async (baseImage: string, prompt: string, count: number = 3): Promise<string[]> => {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ func: 'generateEditVariations', args: [baseImage, prompt, count] }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate edit variations.');
    }

    const result = await response.json();
    return result;
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
    console.log("Starting video generation request...");

    const initialResponse = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ func: 'generateVideoVariations', args: [frontImage, count] }),
    });

    if (!initialResponse.ok) {
        const error = await initialResponse.json();
        console.error("Initial video generation request failed:", error);
        throw new Error(error.error || 'Failed to initiate video generation.');
    }

    const { name: operationName } = await initialResponse.json();
    console.log("Video generation operation started:", operationName);

    let messageIndex = 0;
    onStatusUpdate(videoGenerationMessages[messageIndex]);
    const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % videoGenerationMessages.length;
        onStatusUpdate(videoGenerationMessages[messageIndex]);
    }, 8000);

    let operation;
    let attempts = 0;
    const maxAttempts = 120; // 120 attempts * 5 seconds = 10 minutes timeout

    while (true) {
        if (attempts >= maxAttempts) {
            clearInterval(interval);
            throw new Error("Video generation timed out.");
        }

        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
        attempts++;

        const statusResponse = await fetch(`/api/gemini/operation/${operationName}`);
        if (!statusResponse.ok) {
            console.error("Failed to fetch operation status:", statusResponse.statusText);
            continue; // Keep trying
        }
        operation = await statusResponse.json();
        console.log("Operation status:", operation);

        if (operation.done) {
            clearInterval(interval);
            break;
        }
    }

    onStatusUpdate("Video processing complete!");

    const generatedVideos = operation.response?.generatedVideos;
    if (!generatedVideos || generatedVideos.length === 0) {
        throw new Error("Video generation finished, but no videos were found.");
    }

    const videoUrlPromises = generatedVideos.map(async (video: any) => {
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

