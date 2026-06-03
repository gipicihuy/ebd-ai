import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const INTENT_SYSTEM = `Kamu adalah intent detector. Tugasmu HANYA menganalisis apakah pengguna ingin memutar musik/lagu.

Respond HANYA dengan JSON, tanpa teks lain, tanpa markdown.

Format jika ingin memutar:
{"intent":"media","query":"nama lagu atau artis"}

Format jika BUKAN ingin memutar:
{"intent":"chat"}

Aturan KETAT:
- intent "media" HANYA jika pengguna secara eksplisit meminta untuk memutar/memainkan lagu sekarang
- Kalimat seperti "puterin X", "play X", "putar X", "mainin X", "setelin X", "dengerin X" → media
- Kalimat diskusi/tanya seperti "lagu X bagus ga", "lirik X", "siapa penyanyi X", "genre X", "makna X", "aku suka X" → chat
- Jika ragu, kembalikan chat`;

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing message' });

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-v4-flash',
                max_tokens: 80,
                temperature: 0,
                messages: [
                    { role: 'system', content: INTENT_SYSTEM },
                    { role: 'user', content: message }
                ]
            })
        });

        const data = await response.json();
        const raw = data.choices?.[0]?.message?.content?.trim() || '{"intent":"chat"}';

        let parsed;
        try {
            parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
        } catch {
            parsed = { intent: 'chat' };
        }

        res.status(200).json(parsed);
    } catch (err) {
        console.error('Intent error:', err);
        res.status(200).json({ intent: 'chat' });
    }
}
