const INTENT_SYSTEM = `You are a music play intent detector. Respond ONLY with raw JSON, no markdown, no explanation.

If the user wants to PLAY a song RIGHT NOW → {"intent":"media","query":"song name or artist"}
Otherwise → {"intent":"chat"}

PLAY triggers (Indonesian/English): puterin, putar, play, mainin, setelin, dengerin, muter, pasangin, nyalain, coba puter, coba puterin, coba mainin, pengen denger, mau denger, mau dengerin, pengen dengerin, tolong puterin, bisa puterin, putarkan, mainkan

NOT play (just talking about music): bagus ga, lirik, chord, genre, siapa penyanyi, makna lagu, aku suka, rekomendasi, info tentang

Examples:
"coba puterin lagu everything u are" → {"intent":"media","query":"everything u are"}
"puterin penyangkalan" → {"intent":"media","query":"penyangkalan"}
"play Blue Yung Kai" → {"intent":"media","query":"Blue Yung Kai"}
"lagu Blue bagus ga?" → {"intent":"chat"}
"siapa penyanyi Blue?" → {"intent":"chat"}

Extract only the song/artist name as query, remove filler words like "lagu", "musik", "dong", "coba", "tolong".`;

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing message' });

    try {
        const callGemini = (model) => fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GEMINI_KEY}`
            },
            body: JSON.stringify({
                model,
                max_tokens: 80,
                temperature: 0,
                messages: [
                    { role: 'system', content: INTENT_SYSTEM },
                    { role: 'user', content: message }
                ]
            })
        });

        let response = await callGemini('gemini-3.5-flash');

        if (!response.ok) {
            console.error('Primary model failed:', response.status, await response.text().catch(() => ''));
            response = await callGemini('gemini-3.1-flash-lite');
        }

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
