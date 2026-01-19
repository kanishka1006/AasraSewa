const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

async function checkModels() {
    try {
        const envPath = path.join(__dirname, '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GEMINI_API_KEY=(.*)/);

        if (!match) {
            console.error("No API Key found in .env");
            return;
        }

        const apiKey = match[1].trim();
        console.log("Using API Key ending in...", apiKey.slice(-4));

        // Manual request to list models since SDK might not expose it easily in high-level client
        // Actually, let's just try to hit the API directly using fetch if SDK is annoying, 
        // but SDK doesn't expose listModels in the main 'GoogleGenerativeAI' class? 
        // It resides on a ModelManager usually? 
        // The REST URL is https://generativelanguage.googleapis.com/v1beta/models?key=API_KEY

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.error("Error listing models:", data);
        }

    } catch (e) {
        console.error("Script Error:", e);
    }
}

checkModels();
