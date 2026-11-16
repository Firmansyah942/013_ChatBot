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

        