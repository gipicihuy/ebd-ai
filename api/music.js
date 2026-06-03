import ytSearch from 'yt-search';
import axios from 'axios';
import crypto from 'crypto';

async function savetube(url, format = 'mp3') {
    const id = [
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
        /youtu\.be\/([a-zA-Z0-9_-]{11})/
    ].find(p => p.test(url))?.[Symbol.match](url)?.[1];

    if (!id) throw new Error('Failed to extract ID.');

    const api = axios.create({
        headers: {
            'content-type': 'application/json',
            'origin': 'https://yt.savetube.me',
            'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
        }
    });

    const { data: { cdn } } = await api.get('https://media.savetube.vip/api/random-cdn');
    const { data: { data: encryptedData } } = await api.post(`https://${cdn}/v2/info`, {
        url: `https://www.youtube.com/watch?v=${id}`
    });

    const encrypted = Buffer.from(encryptedData, 'base64');
    const decipher = crypto.createDecipheriv(
        'aes-128-cbc',
        Buffer.from('C5D58EF67A7584E4A29F6C35BBC4EB12', 'hex'),
        encrypted.slice(0, 16)
    );
    const decrypted = JSON.parse(
        Buffer.concat([decipher.update(encrypted.slice(16)), decipher.final()]).toString()
    );

    const { data: { data: { downloadUrl } } } = await api.post(`https://${cdn}/download`, {
        id,
        downloadType: 'audio',
        quality: '128',
        key: decrypted.key
    });

    return {
        title: decrypted.title || null,
        thumbnail: decrypted.thumbnail || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
        duration: decrypted.duration || 0,
        audio: downloadUrl
    };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { q } = req.body;
    if (!q) return res.status(400).json({ error: 'Missing query' });

    try {
        const results = await ytSearch(q);
        const video = results.videos?.[0];
        if (!video) return res.status(404).json({ error: 'Not found' });

        const info = await savetube(video.url, 'mp3');

        // Obfuscated payload — frontend hanya terima data render
        const payload = {
            _t: Date.now(),
            _r: btoa(JSON.stringify({
                n: info.title || video.title,
                a: video.author?.name || video.author || '',
                th: info.thumbnail || video.thumbnail,
                src: info.audio,
                d: info.duration || video.seconds || 0
            }))
        };

        res.status(200).json(payload);
    } catch (err) {
        console.error('Music error:', err);
        res.status(500).json({ error: 'Failed to retrieve media' });
    }
}
