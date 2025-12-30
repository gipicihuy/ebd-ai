// /api/chat.js

import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    const apiKey = process.env.GOOGLE_API_KEY;
    
    // PERBAIKAN: Gunakan model 'gemini-2.0-flash'
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    try {
        const { prompt } = req.body;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
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
