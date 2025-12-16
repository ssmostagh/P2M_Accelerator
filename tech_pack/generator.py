import os
from google import genai
from google.genai import types
from PIL import Image
import io

class Generator:
    def __init__(self, model_name="gemini-3-pro-image-preview"):
        self.client = genai.Client(vertexai=True, project="wortz-project-352116", location="global")
        self.model_name = model_name

    def generate(self, image_path: str, annotations: list[str], prompt_template: str) -> Image.Image:
        # Load image
        image = Image.open(image_path)
        
        # Construct prompt
        annotations_str = "\n".join([f"- {a}" for a in annotations])
        prompt = prompt_template.replace("{annotations}", annotations_str)
        
        # Convert image to bytes
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG')
        img_bytes = img_byte_arr.getvalue()

        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
                    types.Part.from_text(text=prompt)
                ]
            ),
        ]

        generate_content_config = types.GenerateContentConfig(
            temperature = 1,
            top_p = 0.95,
            max_output_tokens = 32768,
            response_modalities = ["TEXT", "IMAGE"],
            safety_settings = [types.SafetySetting(
                category="HARM_CATEGORY_HATE_SPEECH",
                threshold="OFF"
            ),types.SafetySetting(
                category="HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold="OFF"
            ),types.SafetySetting(
                category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold="OFF"
            ),types.SafetySetting(
                category="HARM_CATEGORY_HARASSMENT",
                threshold="OFF"
            )],
            image_config=types.ImageConfig(
                aspect_ratio="1:1",
                image_size="1K",
                output_mime_type="image/png",
            ),
        )

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=generate_content_config
            )
            
            if response.candidates:
                for candidate in response.candidates:
                    if candidate.content and candidate.content.parts:
                        for part in candidate.content.parts:
                            if part.inline_data:
                                return Image.open(io.BytesIO(part.inline_data.data))
            
            print("No image found in response.")
            return None

        except Exception as e:
            print(f"Generation failed: {e}")
            return None
