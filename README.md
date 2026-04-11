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
-   Node.js (v18+ recommended)
-   A Dash Platform Identity and Contract (configured for Testnet)

### 2. Configuration
Create a `.env` file in the `backend` directory:
```env
PORT=3000
USE_DASH_PLATFORM=true
MNEMONIC="your dash testnet mnemonic here"
IDENTITY_ID="your_identity_id_here"
CONTRACT_ID="your_contract_id_here"
```

### 3. Installation
```bash
# Navigate to backend
cd backend
npm install
```

### 4. Launch
```bash
# Start the server
npm start
```
The application will be accessible at:
- **Main App:** [http://localhost:3000/index.html](http://localhost:3000/index.html)
- **Merchant Scanner:** [http://localhost:3000/scanner.html](http://localhost:3000/scanner.html)

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
