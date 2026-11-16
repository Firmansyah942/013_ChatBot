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
