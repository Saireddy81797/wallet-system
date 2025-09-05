const db = require("../db.js");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const register = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    await db.query('INSERT INTO users(id,email,password,created_at) VALUES($1,$2,$3,NOW())', [userId, email, hash]);
    await db.query('INSERT INTO wallets(id,user_id,balance,updated_at) VALUES($1,$2,0,NOW())', [uuidv4(), userId]);

    const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ token });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Email already registered' });
    console.error(err);
    return res.status(500).json({ message: 'Registration failed' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Login failed' });
  }
};

const me = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, email, created_at FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch user' });
  }
};

module.exports = { register, login, me };
