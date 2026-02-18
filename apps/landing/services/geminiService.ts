import { GoogleGenAI } from "@google/genai";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateInstituteAsset = async (promptText: string): Promise<string> => {
  try {
    // Using gemini-3-pro-image-preview (Nano Banana Pro) for top-tier asset generation
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: `Professional, cinematic, high-end 3D render, dark indigo lighting, minimalist abstract, 8k resolution. ${promptText}`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K" // Currently max supported via API for preview
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString: string = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Asset generation failed:", error);
    throw error;
  }
};