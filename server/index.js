import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey && apiKey !== 'PLACEHOLDER_API_KEY' ? new GoogleGenerativeAI(apiKey) : null;
let ai = genAI;

if (ai) {
    console.log('✅ Gemini AI initialized successfully');
} else {
    console.warn('⚠️  GEMINI_API_KEY not set. AI features will be disabled.');
}

// Middleware
app.use(helmet()); // Adds various HTTP headers for security (XSS, Sniffing protection, etc.)
app.use(cors({
    origin: '*', // Allow all origins for Vercel/Custom Domains (Production Safe for Public API)
    methods: ['POST', 'GET', 'OPTIONS'],
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting: 10 requests per minute per IP
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// Root endpoint
app.get('/', (req, res) => {
    res.send('Sooriya Hospital Greetings Backend is Running. Use /api/ endpoints.');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        aiEnabled: ai !== null,
        hfEnabled: !!process.env.HF_TOKEN,
        timestamp: new Date().toISOString()
    });
});

// API Endpoint: Generate Festival Image
app.post('/api/generate-image', async (req, res) => {
    try {
        const { festivalName } = req.body;

        if (!festivalName) {
            return res.status(400).json({ error: 'Festival name is required' });
        }

        console.log(`🎨 Generating image for: ${festivalName}`);

        // Step 1: Enhance Prompt with Gemini (if available) - CRITICAL for good AI images
        let prompt = `A festive, high-quality, 8k resolution, cinematic photo of ${festivalName} celebration. Beautiful lighting, cultural elements, happy atmosphere.`;

        if (ai) {
            try {
                const enhancementPrompt = `Describe a beautiful, photorealistic scene for the festival "${festivalName}". 
                Include visual details like lighting, colors, and specific cultural elements. 
                Keep it under 40 words. Focus on aesthetics.`;

                const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent(enhancementPrompt);
                const aiText = await result.response.text();
                if (aiText) prompt = aiText.trim();
                console.log(`✨ Enhanced Prompt: ${prompt}`);
            } catch (e) {
                console.warn('Subject enhancement failed, using default.');
            }
        }

        // Step 2: Generate Image with Hugging Face (Flux.1)
        if (process.env.HF_TOKEN) {
            try {
                console.log('🚀 Generating with Flux.1-dev on Hugging Face...');
                // Dynamic import to avoid issues if not installed yet
                const { HfInference } = await import('@huggingface/inference');
                const hf = new HfInference(process.env.HF_TOKEN);

                const imageBlob = await hf.textToImage({
                    model: 'stabilityai/stable-diffusion-xl-base-1.0',
                    inputs: prompt,
                    parameters: {
                        guidance_scale: 7.5,
                        num_inference_steps: 25,
                    }
                });

                // Convert Blob to Base64
                const buffer = await imageBlob.arrayBuffer();
                const base64 = Buffer.from(buffer).toString('base64');
                const dataUrl = `data:image/jpeg;base64,${base64}`;

                return res.status(200).json({
                    imageUrl: dataUrl,
                    isAIFallback: false,
                    message: "High-quality AI image generated!"
                });

            } catch (hfError) {
                console.error('⚠️ Hugging Face generation failed:', hfError.message);
                // Fall through to fallback
            }
        } else {
            console.warn('⚠️ HF_TOKEN is missing. Using fallback.');
        }

        // Fallback: Smart Keyword LoremFlickr
        const FESTIVAL_KEYWORDS = {
            'republic': 'india,flag,republic,parade,delhi',
            'pongal': 'pongal,sugarcane,pot,cow,harvest',
            'tamilnewyear': 'tamil,culture,flower,kolam,temple',
            'diwali': 'diwali,lamp,light,fireworks,rangoli',
            'deepavali': 'diwali,lamp,light,fireworks',
            'christmas': 'christmas,tree,santa,gift,winter',
            'newyear': 'fireworks,party,celebration,champagne',
            'valentine': 'love,heart,rose,romance,couple',
            'onam': 'onam,kerala,flower,boat,dance',
            'eid': 'eid,moon,mosque,date,lantern',
            'vinayagar': 'ganesh,idol,flower,temple',
            'karthigai': 'lamp,oil,light,temple',
            'shivaratri': 'shiva,temple,om,worship',
            'thaipoosam': 'murugan,cavadi,temple,festival',
            'independence': 'india,flag,freedom,patriotic',
            'womens': 'woman,flower,happy,strong',
            'doctors': 'doctor,stethoscope,medical,hospital',
            'ayudha': 'tool,worship,flower,sandalwood',
        };

        const normalizedKey = festivalName.toLowerCase().replace(/[^a-z]/g, '');
        let searchKeywords = festivalName + ",festival";

        if (FESTIVAL_KEYWORDS[normalizedKey]) {
            searchKeywords = FESTIVAL_KEYWORDS[normalizedKey];
        } else {
            const foundKey = Object.keys(FESTIVAL_KEYWORDS).find(k => normalizedKey.includes(k));
            if (foundKey) searchKeywords = FESTIVAL_KEYWORDS[foundKey];
        }

        const randomLock = Math.floor(Math.random() * 10000);
        const imageUrl = `https://loremflickr.com/800/1000/${encodeURIComponent(searchKeywords.replace(/ /g, ','))}?lock=${randomLock}`;

        console.log(`✅ Fallback Image URL: ${imageUrl}`);

        return res.status(200).json({
            imageUrl: imageUrl,
            isAIFallback: true,
            message: "Design created successfully (Fallback)."
        });

    } catch (error) {
        console.error('❌ Error generating image:', error.message);
        return res.status(500).json({ error: 'Failed to generate image', details: error.message });
    }
});

// API Endpoint: Generate AI Wish
app.post('/api/generate-wish', async (req, res) => {
    try {
        const {
            festivalName,
            language,
            nativeLanguageName,
            senderName,
            recipientName
        } = req.body;

        if (!festivalName || !language) {
            return res.status(400).json({ error: 'Festival name and language are required' });
        }

        console.log(`💬 Generating wish for: ${festivalName} in ${language}`);

        // Try AI generation if available
        if (ai) {
            try {
                const prompt = `Write a short, warm festival greeting for "${festivalName}" in ${nativeLanguageName} (${language}).
                Include From: ${senderName} and To: ${recipientName}. 
                Use ${language} script. Max 15 words. Just the greeting.`;

                const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
                console.log('🤖 Sending prompt to Gemini (1.5-flash)...');
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text().trim();

                if (text) {
                    console.log('✅ Wish generated successfully:', text.substring(0, 30) + '...');
                    return res.json({ wish: text });
                }
            } catch (innerError) {
                console.warn('⚠️ AI wish generation failed, using fallback:', innerError.message);
            }
        } else {
            console.log('ℹ️ AI not initialized, using fallback wish');
        }

        // Fallback wish if AI missing or failed
        const fallbackWish = `Happy ${festivalName} to ${recipientName}! From ${senderName}`;

        return res.json({
            wish: fallbackWish,
            isAIFallback: true
        });

    } catch (error) {
        console.error('❌ Detailed Error generating wish:', error);
        return res.status(500).json({
            error: 'Failed to generate wish',
            details: error.message,
            stack: error.stack
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 API endpoints protected with rate limiting (10 req/min)`);
});
