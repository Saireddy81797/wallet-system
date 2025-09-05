require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);

// health
app.get('/', (req, res) => res.json({ok: true}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

module.exports = app; // for tests
