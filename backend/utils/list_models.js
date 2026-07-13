import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function listModels() {
    console.log("Checking API Key:", process.env.GEMINI_API_KEY ? "Present" : "Missing");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
        console.log("Fetching available models...");
        // Note: listModels is not directly exposed on the helper but usually via direct request or model retrieval.
        // Actually, the SDK might not expose listModels easily in v0.x. 
        // Let's try a simple generation with a known safe model to see if auth works at least.
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("Success! gemini-pro is working. Response:", result.response.text());
    } catch (error) {
        console.error("Error connecting to Gemini API:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Status Text:", error.response.statusText);
        }
    }
}

listModels();
