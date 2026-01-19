import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(private configService: ConfigService) {
        const rawKey = this.configService.get<string>('GEMINI_API_KEY');
        const apiKey = rawKey ? rawKey.trim() : "";

        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            // Updated to 'gemini-2.0-flash' based on available models list
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        } else {
            console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
        }
    }

    async analyzeSituation(type: string, location: string, details: string, weather: string = "Unknown") {
        if (!this.genAI) {
            return "AI Configuration Error: API Key Missing.";
        }

        const candidates = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];

        const prompt = `
          You are an elite Emergency Response Tactical Advisor. 
          Situation: ${type}
          Location: ${location}
          Current Weather: ${weather}
          Details: ${details}

          Analyze this scenario and provide a concise, actionable 4-point Tactical Response Plan for the Rescue Team.
          Format the output as a clean text list. 
          IF WEATHER IS BAD: Prioritize weather-related safety (e.g. wind direction, flood risk).
          Focus on immediate safety, crowd control, and triage.
          Keep it under 100 words.
        `;

        for (const modelName of candidates) {
            try {
                console.log(`Trying Gemini Model: ${modelName}...`);
                const model = this.genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                console.log(`Success with ${modelName}!`);
                return text;
            } catch (error) {
                console.warn(`Failed with ${modelName}: ${error.message}`);
                // If 401 (Auth), stop immediately.
                if (error.message?.includes('401') || error.message?.includes('API_KEY_INVALID')) {
                    return "AI Error: Invalid API Key. Please check your credentials.";
                }
            }
        }

        // Final Fallback: Direct REST API (Bypassing SDK, Trying Multiple Models)
        const fallbackModels = ['gemini-2.0-flash', 'gemini-flash-latest'];

        try {
            console.log("Attempting Direct REST API Fallback...");
            const apiKey = this.configService.get<string>('GEMINI_API_KEY')?.trim();

            if (!apiKey) {
                return "Config Error: GEMINI_API_KEY is missing in backend/.env";
            }

            for (const model of fallbackModels) {
                try {
                    console.log(`REST Fallback: Trying ${model}...`);
                    const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

                    const response = await fetch(restUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }]
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                            console.log(`Success with Direct REST API (${model})!`);
                            return text;
                        }
                    }
                } catch (e) {
                    console.warn(`REST ${model} failed.`);
                }
            }

            // If we reached here, ALL models failed (SDK + REST). 
            // Let's ask Google WHAT models are available for this key.
            console.log("Fetching available models...");
            const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            const listReq = await fetch(listUrl);
            const listData = await listReq.json();

            if (listData.models) {
                const names = listData.models.map(m => m.name.replace('models/', '')).join(', ');
                return `AI Connection Failed. Your API Key only has access to: [${names}]. Update the code or check permissions.`;
            } else {
                return `AI Connection Failed: API Key seems valid but returned no models. Error: ${JSON.stringify(listData.error || listData)}`;
            }

        } catch (e) {
            console.error("REST Fallback Failed:", e.message);
            return `AI Connection Failed: ${e.message}`;
        }

        return "AI Error: Unknown failure occurred.";
    }
}
