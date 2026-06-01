import path from 'path';
import { fileURLToPath } from 'url';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { base64, mime, prompt } = req.body;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({
                model: 'qwen/qwen3-vl-32b-instruct',
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
                            { type: 'text', text: prompt || 'Describe this image in detail.' }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();
        const description = data.choices?.[0]?.message?.content || '';
        res.status(200).json({ description });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Vision error', description: '' });
    }
}
