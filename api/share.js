export default async function handler(req, res) {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    // ── GET: ambil gist by id ──
    if (req.method === 'GET') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing id' });

        try {
            const r = await fetch(`https://api.github.com/gists/${id}`, {
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                    ...(GITHUB_TOKEN && { 'Authorization': `Bearer ${GITHUB_TOKEN}` })
                }
            });
            if (!r.ok) return res.status(404).json({ error: 'Gist not found' });
            const gist = await r.json();
            const content = gist.files?.['conversation.json']?.content;
            if (!content) return res.status(404).json({ error: 'Invalid gist' });
            const data = JSON.parse(content);
            return res.status(200).json(data);
        } catch (err) {
            return res.status(500).json({ error: 'Failed to fetch gist' });
        }
    }

    // ── POST: buat gist baru ──
    if (req.method === 'POST') {
        if (!GITHUB_TOKEN) return res.status(500).json({ error: 'GITHUB_TOKEN not set' });

        const { messages, title } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid messages' });
        }

        const payload = {
            title: title || 'Shared Chat',
            created_at: new Date().toISOString(),
            messages
        };

        try {
            const r = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                    'X-GitHub-Api-Version': '2022-11-28'
                },
                body: JSON.stringify({
                    description: `Eberardos AI - ${payload.title}`,
                    public: false,
                    files: {
                        'conversation.json': {
                            content: JSON.stringify(payload, null, 2)
                        }
                    }
                })
            });

            if (!r.ok) {
                const err = await r.json();
                return res.status(500).json({ error: err.message || 'Failed to create gist' });
            }

            const gist = await r.json();
            return res.status(200).json({ id: gist.id });
        } catch (err) {
            return res.status(500).json({ error: 'Failed to create gist' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
