import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { prompt } = req.body;

        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const systemPrompt = await fs.readFile(path.join(__dirname, '../data/system-prompt.txt'), 'utf-8');

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-v4-flash',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ]
            })
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
