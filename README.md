# Wallet System (Backend)

Simple wallet/payment backend: user registration, JWT auth, deposit, transfer, transaction history.

## Quick start (local with Docker Postgres)

1. Start Postgres:

2. Create tables:

3. Copy `.env.example` → `.env` and update values.

4. Install and run:

## Endpoints

- `POST /api/auth/register` { email, password } → { token }
- `POST /api/auth/login` { email, password } → { token }
- `GET /api/auth/me` (auth)
- `POST /api/wallet/deposit` { amount } (auth)
- `GET  /api/wallet/balance` (auth)
- `POST /api/wallet/transfer` { to_email, amount } (auth)
- `GET  /api/wallet/transactions` (auth)

## Testing via curl

Register:

Login:

Deposit (replace TOKEN):

Transfer (replace TOKEN):
git add .
git commit -m "Initial commit: wallet-system backend (auth, wallet, transactions)"
git push origin main
