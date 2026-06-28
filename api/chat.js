import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const abortController = new AbortController();

    req.on('close', () => {
        abortController.abort();
    });

    try {
        const { prompt } = req.body;
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const systemPrompt = await fs.readFile(path.join(__dirname, '../data/system-prompt.txt'), 'utf-8');

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                stream: true,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ]
            }),
            signal: abortController.signal
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            res.write(chunk);
        }

        res.end();
    } catch (error) {
        if (error.name === 'AbortError') {
            res.end();
        } else {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
