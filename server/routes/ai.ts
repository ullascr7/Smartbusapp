import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { dbStore } from '../db.js';

const router = Router();

let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (e) {
      console.warn('Gemini client init warning:', e);
    }
  }
  return aiClient;
}

// POST /api/ai/assistant - Smart AI assistant for village & city travelers
router.post('/assistant', async (req, res) => {
  try {
    const { query, source, destination } = req.body;
    const adminRate = dbStore.getAdminSettings().fare_per_km || 1.50;

    const promptContext = `You are SmartBus AI Assistant, a friendly and intelligent travel assistant for public bus travel across Karnataka (inspired by KSRTC and rural feeder networks).
The system supports village-to-city bookings with an official fare rate of ₹${adminRate.toFixed(2)} per kilometer.
Current inquiry: "${query || `Travel advice from ${source} to ${destination}`}".
Respond clearly, concisely, and helpfully in 2-3 short paragraphs or bullet points. Include practical tips for village travelers, luggage advice, or best connecting hubs if needed.`;

    const ai = getAiClient();
    if (ai) {
      try {
        // Primary model: gemini-3.8-flash (or fallback to gemini-3.6-flash)
        let response;
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: promptContext
          });
        } catch (mErr: any) {
          console.warn('gemini-3.8-flash failed, attempting gemini-3.6-flash fallback:', mErr?.message);
          response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: promptContext
          });
        }

        const reply = response.text;
        if (reply) {
          return res.json({ reply });
        }
      } catch (geminiError) {
        console.warn('Gemini API call fell back to local assistant:', geminiError);
      }
    }

    // High quality intelligent local travel advice fallback
    const src = source || 'your village';
    const dest = destination || 'your destination';
    const fallbackReply = `🚌 **SmartBus AI Travel Recommendation**:
- **Route Guidance**: For journeys from **${src}** to **${dest}**, buses operate with regular intermediate stops. Village passengers can board directly from local Handposts and designated rural bus shelters.
- **Fare Estimate**: Calculated using the official distance formula at ₹${adminRate.toFixed(2)}/km. Intermediate boarding tickets are issued at exact distance increments.
- **Connecting Transit**: If a direct bus is full, transfers are easily accessible via Mysuru Suburban Bus Stand or Bengaluru Kempegowda Bus Station (Majestic).
- **Pro Tip**: Keep your digital PNR ready on your smartphone for quick QR scanning by the bus conductor.`;

    return res.json({ reply: fallbackReply });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to process AI travel advice' });
  }
});

export default router;
