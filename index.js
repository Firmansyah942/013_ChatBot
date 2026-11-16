const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 1. Setup Middleware: Mengaktifkan parser JSON dan direktori file statis 'public'
app.use(express.json());
app.use(express.static('public'));
