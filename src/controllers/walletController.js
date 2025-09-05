const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const deposit = async (req, res) => {
  const userId = req.user.id;
  const amt = Number(req.body.amount);
  if (!amt || amt <= 0) return res.status(400).json({ message: 'Invalid amount' });

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const up = await client.query('UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2 RETURNING balance', [amt, userId]);
    if (up.rowCount === 0) throw new Error('Wallet not found');

    await client.query('INSERT INTO transactions(id, from_user, to_user, amount, type, status, created_at) VALUES($1,$2,$3,$4,$5,$6,NOW())',
      [uuidv4(), null, userId, amt, 'deposit', 'success']
    );

    await client.query('COMMIT');
    return res.json({ balance: up.rows[0].balance });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ message: 'Deposit failed' });
  } finally {
    client.release();
  }
};

const balance = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Wallet not found' });
    return res.json({ balance: rows[0].balance });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch balance' });
  }
};

const transfer = async (req, res) => {
  const fromId = req.user.id;
  const { to_email, amount } = req.body;
  const amt = Number(amount);
  if (!amt || amt <= 0) return res.status(400).json({ message: 'Invalid amount' });

  try {
    const { rows: recip } = await db.query('SELECT id FROM users WHERE email = $1', [to_email]);
    if (recip.length === 0) return res.status(404).json({ message: 'Recipient not found' });
    const toId = recip[0].id;
    if (toId === fromId) return res.status(400).json({ message: 'Cannot transfer to self' });

    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      // lock sender wallet row
      const { rows: balRows } = await client.query('SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE', [fromId]);
      if (balRows.length === 0) throw new Error('Sender wallet not found');
      const current = Number(balRows[0].balance);
      if (current < amt) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Insufficient balance' });
      }

      await client.query('UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE user_id = $2', [amt, fromId]);
      await client.query('UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2', [amt, toId]);

      await client.query('INSERT INTO transactions(id, from_user, to_user, amount, type, status, created_at) VALUES($1,$2,$3,$4,$5,$6,NOW())',
        [uuidv4(), fromId, toId, amt, 'transfer', 'success']
      );

      await client.query('COMMIT');
      return res.json({ message: 'Transfer successful' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      return res.status(500).json({ message: 'Transfer failed' });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal error' });
  }
};

const transactions = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, from_user, to_user, amount, type, status, created_at FROM transactions WHERE from_user = $1 OR to_user = $1 ORDER BY created_at DESC LIMIT 100',
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

module.exports = { deposit, balance, transfer, transactions };
