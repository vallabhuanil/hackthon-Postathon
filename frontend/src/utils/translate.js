// utils/translate.js
import axios from "axios";

// Cache for translations
const translationCache = {};

// Your backend URL
const BACKEND_URL = "http://localhost:3001/api";

export const translate = async (text, targetLang) => {
  // Return original text if target is English or no text
  if (!text || targetLang === "en" || !text.trim()) {
    return text;
  }

  // Check cache first
  const cacheKey = `${text}-${targetLang}`;
  if (translationCache[cacheKey]) {
    console.log("Using cached translation for:", text.substring(0, 30));
    return translationCache[cacheKey];
  }

  try {
    console.log(`Translating to ${targetLang}:`, text.substring(0, 50));

    // Call your backend translation endpoint
    const response = await axios.post(
      `${BACKEND_URL}/translate/`,
      {
        text: text,
        to: targetLang,
        from: "en"  // Assuming source is English
      },
      {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("Translation response:", response.data);

    if (response.data && response.data.translatedText) {
      const translatedText = response.data.translatedText;
      
      // Cache the result
      translationCache[cacheKey] = translatedText;
      
      return translatedText;
    } else if (response.data && response.data.translation) {
      // Alternative response format
      const translatedText = response.data.translation;
      translationCache[cacheKey] = translatedText;
      return translatedText;
    } else {
      console.warn("Unexpected response format:", response.data);
      return text; // Return original if response format is unexpected
    }
  } catch (error) {
    console.error("Translation error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });

    // Fallback to free translation service
    try {
      console.log("Trying fallback translation service...");
      
      // Using a free translation service as fallback
      const fallbackResponse = await axios.post(
        "https://libretranslate.com/translate",
        {
          q: text,
          source: "en",
          target: targetLang,
          format: "text"
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (fallbackResponse.data && fallbackResponse.data.translatedText) {
        const translatedText = fallbackResponse.data.translatedText;
        translationCache[cacheKey] = translatedText;
        return translatedText;
      }
    } catch (fallbackError) {
      console.error("Fallback translation also failed:", fallbackError.message);
    }

    // Return original text as last resort
    console.log("Returning original text due to translation failure");
    return text;
  }
};

// Clear cache function
export const clearTranslationCache = () => {
  Object.keys(translationCache).forEach(key => {
    delete translationCache[key];
  });
  console.log("Translation cache cleared");
};