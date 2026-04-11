/**
 * dashClient.js — Dash SDK singleton with testnet-config.json integration.
 * 
 * Reads verified DAPI fallback nodes and skipSyncBeforeHeight from the
 * battle-tested testnet-config.json (sourced from dash_identity package).
 * 
 * Provides rich startup logging for hackathon demo visibility.
 */
require('dotenv').config();
const Dash = require('dash');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Load testnet configuration
// ---------------------------------------------------------------------------
const CONFIG_PATH = path.join(__dirname, '../../testnet-config.json');

function loadTestnetConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.warn('[Dash] testnet-config.json not found — using SDK defaults.');
    return null;
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------
const USE_DASH_PLATFORM = process.env.USE_DASH_PLATFORM === 'true';
const IDENTITY_ID = process.env.IDENTITY_ID || null;
const CONTRACT_ID = process.env.CONTRACT_ID || null;
const MNEMONIC = process.env.MNEMONIC || null;

let client = null;
let testnetConfig = null;
let ready = false;

// ---------------------------------------------------------------------------
// Initialization (called once from server.js)
// ---------------------------------------------------------------------------
async function initialize() {
  console.log('\n========================================');
  console.log('  DASH PLATFORM INITIALIZATION');
  console.log('========================================');

  // Load testnet config
  testnetConfig = loadTestnetConfig();

  if (testnetConfig) {
    console.log(`[Dash] ✓ Testnet config loaded (verified ${testnetConfig.lastKnownGoodDate})`);
    console.log(`[Dash] ✓ Using fallback DAPI nodes: ${testnetConfig.dapiAddresses.join(', ')}`);
    console.log(`[Dash] ✓ Fast sync enabled (skipSyncBeforeHeight: ${testnetConfig.skipSyncBeforeHeight})`);
  }

  if (!USE_DASH_PLATFORM) {
    console.log('[Dash] ⚡ USE_DASH_PLATFORM = false');
    console.log('[Dash] ⚡ Running in LOCAL MEMORY mode (demo-safe fallback)');
    console.log('========================================\n');
    return;
  }

  if (!MNEMONIC) {
    console.log('[Dash] ⚠ USE_DASH_PLATFORM = true but no MNEMONIC found in .env');
    console.log('[Dash] ⚠ Falling back to LOCAL MEMORY mode');
    console.log('[Dash] ℹ Run: cd ../dash_identity/identity-scripts && node create-identity.mjs');
    console.log('========================================\n');
    return;
  }

  // Build wallet options using testnet-config.json values
  const walletOpts = { mnemonic: MNEMONIC };
  if (testnetConfig && testnetConfig.skipSyncBeforeHeight) {
    walletOpts.unsafeOptions = {
      skipSynchronizationBeforeHeight: testnetConfig.skipSyncBeforeHeight
    };
  }

  // Build client options
  const clientOpts = {
    network: (testnetConfig && testnetConfig.network) || 'testnet',
    wallet: walletOpts
  };

  // Use verified DAPI fallback nodes
  if (testnetConfig && testnetConfig.dapiAddresses) {
    clientOpts.dapiAddresses = testnetConfig.dapiAddresses;
  }

  // Register app contract if available
  if (CONTRACT_ID) {
    clientOpts.apps = {
      VoucherApp: { contractId: CONTRACT_ID }
    };
  }

  try {
    client = new Dash.Client(clientOpts);
    console.log('[Dash] ✓ SDK Client initialized');

    if (IDENTITY_ID) {
      console.log(`[Dash] ✓ Identity loaded: ${IDENTITY_ID}`);
    }
    if (CONTRACT_ID) {
      console.log(`[Dash] ✓ Data Contract: ${CONTRACT_ID}`);
    }

    ready = true;
    console.log('[Dash] ✓ Dash Platform mode ACTIVE');
  } catch (err) {
    console.error(`[Dash] ✗ SDK init failed: ${err.message}`);
    console.log('[Dash] ⚠ Falling back to LOCAL MEMORY mode');
    client = null;
  }

  console.log('========================================\n');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
function isReady() {
  return USE_DASH_PLATFORM && ready && client !== null;
}

function getClient() {
  return client;
}

function getIdentityId() {
  return IDENTITY_ID;
}

function getContractId() {
  return CONTRACT_ID;
}

async function disconnect() {
  if (client) {
    await client.disconnect();
    client = null;
    ready = false;
  }
}

module.exports = {
  initialize,
  isReady,
  getClient,
  getIdentityId,
  getContractId,
  disconnect,
  USE_DASH_PLATFORM
};
