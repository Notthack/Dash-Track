# 🛡️ Sure Vouch

### Premium Conditional Voucher System — Powered by Dash Platform

A sophisticated, role-based application built for the **NottsHack 2026** competition. **Sure Vouch** demonstrates trust-verified conditional payments using Dash Platform's decentralized data storage (Drive) and identity systems.

---

## 🌟 Key Features

### 👔 Sponsor Admin Station
*   **Voucher Generation:** Issue secure vouchers with custom DASH amounts (e.g., 10 DASH) directly to the Dash Platform.
*   **Premium Voucher Design:** Automatically generates a high-contrast, premium-themed voucher card with a scannable QR code.
*   **Lifecycle Management:** Full control over the voucher lifecycle, including real-time revocation capabilities.
*   **History Ledger:** A live, auto-polling transaction history table to track all issued, redeemed, and revoked vouchers.
*   **Universal Copy:** Robust "Copy ID" functionality optimized for both mobile and desktop (including non-HTTPS) contexts.

### 🏪 Merchant Station
*   **Integrated QR Scanner:** Built-in scanner with animated laser overlays for rapid voucher validation.
*   **Real-Time Verification:** Instant status checks against Dash Platform to prevent double-spending or use of revoked vouchers.
*   **One-Tap Redemption:** Merchant-side redemption flow that updates the global ledger state immediately.

---

## 🚀 Tech Stack

-   **Backend:** Node.js / Express (Port 3000)
-   **Frontend:** Vanilla JS / Premium CSS (Stitch-inspired tokens, Glassmorphism, Dynamic Animations)
-   **Decentralized Core:** Dash SDK (v6.0.1) for Platform Identity, Contract, and Drive interactions.
-   **Security:** Trust-verified data contracts on Dash Testnet.
-   **Storage:** Multi-path strategy (Dash Platform Drive with a resilient Local Fallback).

---

## 🛠️ Getting Started

### 1. Prerequisites
-   Node.js 24 LTS and npm
-   No wallet or Dash credentials are needed for the local demo.

### 2. Configuration
Run commands from the `backend` directory so dotenv loads the correct file:
```bash
cd backend
cp .env.example .env
```

The example defaults to `USE_DASH_PLATFORM=false`: vouchers are stored in memory
and disappear when the server restarts. Keep `.env` local; it is ignored by Git.

### 3. Installation
```bash
npm ci
```

### 4. Launch
```bash
# Start the server
npm start
```
The application will be accessible at:
- **Main App:** [http://localhost:3000/index.html](http://localhost:3000/index.html)
- **Merchant Scanner:** [http://localhost:3000/scanner.html](http://localhost:3000/scanner.html)

### Optional Dash Testnet storage

Create a fresh Testnet wallet, identity and voucher data contract, then set
`USE_DASH_PLATFORM=true`, `MNEMONIC`, `IDENTITY_ID` and `CONTRACT_ID` in your local
`backend/.env`. Restart the server after changing configuration. The contract
schema is in `backend/setup-dash.js`; run `node setup-dash.js` from `backend` only
after configuring your own fresh Testnet mnemonic and identity. Registration
writes the new `CONTRACT_ID` to that local file and consumes Testnet credits.
The separate identity-creation scripts mentioned in that file are not included
in this repository.

Never reuse a mnemonic that has appeared in this repository or another public
location, even for a demo. Deleting it from Git does not make it safe again.
Never use a wallet containing real assets with this prototype.

### Demo limits

Payments are simulated by `DashPaymentService`, including when Dash storage is
enabled. The role selector is a UI switch, not server-side authentication.
This hackathon prototype is intended for local evaluation, not deployment with
real funds. Dependencies are installed from the lockfile rather than committed
as `node_modules`.

---

## 📐 Architecture

The system follows a strict **MVC separation** of concerns:
- **Models:** Handle complex Dash SDK interactions and state transitions.
- **Views:** Premium components built with high-cohesion CSS and semantic HTML.
- **Controllers:** Orchestrate logic between the UI and the Backend API.

**Resilience Strategy:** The system utilizes a `StorageFactory` that prioritizes Dash Platform Drive while maintaining a local fallback to ensure a smooth demo experience even under intermittent network conditions.

---

## 👨‍💻 Created for NottsHack 2026
Built with a focus on **User Experience**, **Reliability**, and **Clean Architecture**.
