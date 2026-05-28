import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    const apiKey = process.env.GOOGLE_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    try {
        const { prompt } = req.body;

        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const systemPrompt = await fs.readFile(path.join(__dirname, '../data/system-prompt.txt'), 'utf-8');
        const fullPrompt = `${systemPrompt}\n\n${prompt}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: fullPrompt }]
                }]
            })
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Error saat meneruskan permintaan:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
