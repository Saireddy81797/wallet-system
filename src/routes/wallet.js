const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { deposit, balance, transfer, transactions } = require('../controllers/walletController');

router.post('/deposit', auth, deposit);
router.get('/balance', auth, balance);
router.post('/transfer', auth, transfer);
router.get('/transactions', auth, transactions);

module.exports = router;
