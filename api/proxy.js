export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();

    const { u } = req.query;
    if (!u) return res.status(400).end();

    let url;
    try {
        url = atob(u);
    } catch {
        return res.status(400).end();
    }

    try {
        const upstream = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36',
                'Referer': 'https://yt.savetube.me/'
            }
        });

        if (!upstream.ok) return res.status(upstream.status).end();

        const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
        const contentLength = upstream.headers.get('content-length');

        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        if (contentLength) res.setHeader('Content-Length', contentLength);

        const reader = upstream.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
        }
        res.end();
    } catch (err) {
        console.error('Proxy error:', err);
        res.status(500).end();
    }
}
