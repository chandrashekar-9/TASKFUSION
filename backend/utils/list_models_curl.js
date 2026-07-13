import fs from 'fs';
// using native fetch
const list = async () => {
    const key = process.env.GEMINI_API_KEY || "AIzaSyDYrWp1b0js1TPnOyTO0_0Pq7dePXH0vBw";
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    console.log("Fetching:", url);
    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
            console.error("API Error:", JSON.stringify(data.error, null, 2));
        } else {
            console.log("Available Models:");
            data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods})`));
            fs.writeFileSync('models.json', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}
list();
