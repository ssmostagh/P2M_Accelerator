import { useState, useCallback } from 'react';

// Note: This will be updated to use backend API calls
// For now, we'll handle the API through the server

export function useGeminiImage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9') => {
    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          func: 'generateMoodboardImage',
          args: [prompt, aspectRatio]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const dataUrl = await response.json();
      setImageUrl(dataUrl);
    } catch (e) {
      console.error("API Error:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setDirectImageUrl = useCallback((url: string) => {
    setImageUrl(url);
    setError(null);
  }, []);

  return { imageUrl, isLoading, error, generate, setDirectImageUrl };
}
