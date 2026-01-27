// controllers/translate.controller.js
import { GoogleGenAI } from "@google/genai";

class TranslateService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;

    console.log("TranslateService initialized");
    console.log("GEMINI_API_KEY present:", !!this.apiKey);

    if (this.apiKey) {
      this.ai = new GoogleGenAI(this.apiKey);
    } else {
      this.ai = null;
    }
  }

  async translateText({ text, to }) {
    try {
      console.log("AI translateText called");
      console.log("this.ai =", this.ai);

      if (!this.ai) {
        throw new Error("Gemini API key not configured");
      }

      const prompt = `
Translate the following text from English to ${to}.

TEXT TO TRANSLATE:
"${text}"

### TRANSLATION GUIDELINES:
- Translate accurately preserving all emojis and symbols
- Maintain the same tone and formality
- Keep any technical terms or proper names unchanged
- Preserve formatting like line breaks if present

### OUTPUT FORMAT:
Respond ONLY with the translated text in ${to}.
Do not add explanations, markdown, or extra text.
`;

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 200,
        },
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error("Empty response from Gemini");
      }

      // Clean text
      let cleanText = rawText.trim();
      
      return {
        translatedText: cleanText,
        original: text,
        language: to
      };
      
    } catch (error) {
      console.error("Translation Error:", error.message);

      // 🔒 HARD FAIL-SAFE (DO NOT BREAK CHAT FLOW)
      return {
        translatedText: text,
        original: text,
        language: to,
        error: "Translation failed, using original text"
      };
    }
  }
}

// ✅ EXPORT SINGLETON (SAME FORMAT)
const translateService = new TranslateService();

// Express controller function
export const translateText = async (req, res) => {
  try {
    const { text, to } = req.body;
    
    console.log("Translation request:", { text, to });
    
    if (!text || to === "en") {
      return res.json({ translatedText: text });
    }

    const result = await translateService.translateText({ text, to });
    
    res.json({ 
      success: true,
      translatedText: result.translatedText,
      original: result.original
    });
    
  } catch (error) {
    console.error("Controller error:", error);
    res.json({ 
      translatedText: req.body.text || "",
      error: "Translation service unavailable"
    });
  }
};

export default translateService;