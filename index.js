const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 1. Setup Middleware: Mengaktifkan parser JSON dan direktori file statis 'public'
app.use(express.json());
app.use(express.static('public'));

// 2. Setup Routing Utama: Mengirim file index.html saat root URL diakses
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// 3. Endpoint Chat API: Menangani request POST untuk komunikasi dengan AI
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
    
        // 4. Validasi Input: Memastikan data pesan yang dikirim client berupa array
        if (!message || !Array.isArray(message)) {
            return res.status(400).json({ error: "Message harus berupa array" });
        }

        // 5. Integrasi OpenRouter: Mengirim request ke API OpenRouter menggunakan model Gemini
        const response = await fetch('https://api.openrouter.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: message,
                temperature: 0.7,
                max_tokens: 1000,
                stream: true
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("OpenRouter Error:", errorData);
            return res.status(response.status).json({ error: errorData });
        }

        // 6. Konfigurasi SSE (Server-Sent Events): Mengatur header agar server bisa mengirim data secara streaming real-time
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = '';

        // 7. Looping Stream Reader: Membaca potongan byte data (chunk) yang dikirim oleh API secara bertahap
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                const trimmedLine = line.trim();
                
                if (!trimmedLine.startsWith('data: ')) continue;
                const data = trimmedLine.slice(5).trim();
                if (data === '[DONE]') continue;

                try {
                    const json = JSON.parse(data);
                    const content = json.choices[0]?.delta?.content;
                    // 8. Kirim Potongan Teks: Meneruskan teks respons AI ke client secara real-time via SSE
                    if (content) {
                        res.write(`data: ${JSON.stringify({ content })}\n\n`);
                    }
                } catch (err) {
                    console.error("Gagal parsing streaming data:", err);
                }
            }
        }

        