// Secure API Service - Calls backend instead of Gemini directly
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// 1. Native Translations for Festivals to ensure 100% localized fallbacks
const FESTIVAL_TRANSLATIONS: Record<string, Record<string, string>> = {
  'newyear': { ta: 'புத்தாண்டு', kn: 'ಹೊಸ ವರ್ಷ', hi: 'नया साल' },
  'pongal': { ta: 'பொங்கல்', kn: 'ಸಂಕ್ರಾಂತಿ', hi: 'पोंगल' },
  'republic': { ta: 'குடியரசு தினம்', kn: 'ಗಣರಾಜ್ಯೋತ್ಸವ', hi: 'गणतंत्र दिवस' },
  'thaipoosam': { ta: 'தைப்பூசம்', kn: 'ತೈಪೂಸಂ', hi: 'थाईपुसम' },
  'valentine': { ta: 'காதலர் தினம்', kn: 'ಪ್ರೇಮಿಗಳ ದಿನ', hi: 'वेलेंटाइन डे' },
  'shivaratri': { ta: 'மகா சிவராத்திரி', kn: 'ಮಹಾಶಿವರಾತ್ರಿ', hi: 'महाशिवरात्रि' },
  'womens': { ta: 'மகளிர் தினம்', kn: 'ಮಹಿಳಾ ದಿನಾಚರಣೆ', hi: 'महिला दिवस' },
  'eid': { ta: 'ரம்ஜான்', kn: 'ರಂಜಾನ್', hi: 'ईद' },
  'tamilnewyear': { ta: 'தமிழ் புத்தாண்டு', kn: 'ತಮಿಳು ಹೊಸ ವರ್ಷ', hi: 'तमिल नव वर्ष' },
  'doctors': { ta: 'மருத்துவர் தினம்', kn: 'ವೈದ್ಯರ ದಿನ', hi: 'चिकित्सक दिवस' },
  'independence': { ta: 'சுதந்திர தினம்', kn: 'ಸ್ವಾತಂತ್ರ್ಯ ದಿನ', hi: 'स्वतंत्रता दिवस' },
  'vinayagar': { ta: 'விநாயகர் சதுர்த்தி', kn: 'ಗಣೇಶ ಚತುರ್ಥಿ', hi: 'गणेश चतुर्थी' },
  'onam': { ta: 'ஓணம்', kn: 'ಓಣಂ', hi: 'ಓಣಂ' },
  'ayudha': { ta: 'ஆயுத பூஜை', kn: 'ಆಯುಧ ಪೂಜೆ', hi: 'आयुध पूजा' },
  'diwali': { ta: 'தீபாவளி', kn: 'ದೀಪಾವಳಿ', hi: 'दीपावली' },
  'karthigai': { ta: 'கார்த்திகை தீபம்', kn: 'ಕಾರ್ತಿಕ ದೀಪ', hi: 'कार्तिकेय दीपम' },
  'christmas': { ta: 'கிறிஸ்துமஸ்', kn: 'ಕ್ರಿಸ್ಮಸ್', hi: 'क्रिसमस' },
};

// 2. Enhanced Fallback Generators
const FALLBACK_MESSAGES: Record<string, (fName: string) => string> = {
  'en': (f) => `Happy ${f}!`,
  'ta': (f) => `இனிய ${f} நல்வாழ்த்துக்கள்!`,
  'kn': (f) => `${f} ಹಬ್ಬದ ಶುಭಾಶಯಗಳು!`,
  'hi': (f) => `${f} की हार्दिक शुभकामनाएँ!`,
};

export const generateAiWish = async (
  festivalName: string,
  festivalId: string,
  language: string,
  nativeLanguageName: string,
  languageCode: string,
  senderName: string,
  recipientName: string
): Promise<string> => {

  // Helper to get a fully localized string (no English festival names)
  const getFallback = () => {
    const translatedFestival = FESTIVAL_TRANSLATIONS[festivalId]?.[languageCode] || festivalName;
    const generator = FALLBACK_MESSAGES[languageCode] || FALLBACK_MESSAGES['en'];
    return generator(translatedFestival);
  };

  try {
    console.log(`📡 Calling backend API to generate wish...`);

    const response = await fetch(`${BACKEND_URL}/api/generate-wish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        festivalName,
        festivalId,
        language,
        nativeLanguageName,
        languageCode,
        senderName,
        recipientName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.wish?.trim();

    if (!text) return getFallback();

    // STRICT SCRIPT VALIDATION
    if (languageCode === 'ta' && !/[\u0B80-\u0BFF]/.test(text)) {
      console.warn("AI response did not contain Tamil characters. Using fallback.");
      return getFallback();
    }

    if (languageCode === 'kn' && !/[\u0C80-\u0CFF]/.test(text)) {
      console.warn("AI response did not contain Kannada characters. Using fallback.");
      return getFallback();
    }

    if (languageCode === 'hi' && !/[\u0900-\u097F]/.test(text)) {
      console.warn("AI response did not contain Devanagari characters. Using fallback.");
      return getFallback();
    }

    return text;
  } catch (error) {
    console.error("Error generating wish:", error);
    return getFallback();
  }
};

export const generateFestivalImage = async (festivalName: string): Promise<string | null> => {
  try {
    console.log(`📡 Calling backend API to generate image for: ${festivalName}`);

    const response = await fetch(`${BACKEND_URL}/api/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        festivalName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return data.imageUrl || null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};