const express = require('express');
const cors = require('cors');
const path = require('path');
const voucherRoutes = require('./routes/voucherRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../frontend')));

// Routes
app.use('/api', voucherRoutes);

// Health check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

module.exports = app;
