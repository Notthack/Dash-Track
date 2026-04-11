/**
 * setup-dash.js — Register a Data Contract on Dash Platform.
 * 
 * Prerequisites:
 *   1. Run `node ../dash_identity/identity-scripts/create-identity.mjs` first
 *   2. Copy the MNEMONIC and IDENTITY_ID into backend/.env
 * 
 * This script:
 *   1. Loads testnet-config.json for DAPI nodes + skipSyncBeforeHeight
 *   2. Connects with your existing mnemonic/identity
 *   3. Registers the "voucher" Data Contract schema
 *   4. Writes CONTRACT_ID into .env
 * 
 * Usage:
 *   node setup-dash.js
 */
require('dotenv').config();
const Dash = require('dash');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Load testnet config (same one used at runtime)
// ---------------------------------------------------------------------------
const configPath = path.join(__dirname, 'testnet-config.json');
if (!fs.existsSync(configPath)) {
  console.error('testnet-config.json not found. Copy it from dash_identity/identity-scripts/');
  process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// ---------------------------------------------------------------------------
// Validate .env prerequisites
// ---------------------------------------------------------------------------
const MNEMONIC = process.env.MNEMONIC;
const IDENTITY_ID = process.env.IDENTITY_ID;

if (!MNEMONIC || !IDENTITY_ID) {
  console.error('\n=== SETUP REQUIRES IDENTITY ===');
  console.error('Before running this script, you must:');
  console.error('');
  console.error('  1. cd ../dash_identity/identity-scripts');
  console.error('  2. node create-identity.mjs');
  console.error('  3. Copy MNEMONIC and IDENTITY_ID into backend/.env:');
  console.error('');
  console.error('     USE_DASH_PLATFORM=true');
  console.error('     MNEMONIC="your twelve word mnemonic"');
  console.error('     IDENTITY_ID="your-identity-id"');
  console.error('');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n=== Dash Data Contract Registration ===\n');
  console.log(`Using testnet config (verified ${config.lastKnownGoodDate})`);
  console.log(`DAPI nodes: ${config.dapiAddresses.join(', ')}`);

  const walletOpts = { mnemonic: MNEMONIC };
  if (config.skipSyncBeforeHeight) {
    walletOpts.unsafeOptions = {
      skipSynchronizationBeforeHeight: config.skipSyncBeforeHeight
    };
    console.log(`Fast sync: skipping before block ${config.skipSyncBeforeHeight}`);
  }

  const client = new Dash.Client({
    network: config.network,
    dapiAddresses: config.dapiAddresses,
    wallet: walletOpts,
  });

  try {
    // Fetch existing identity
    console.log(`\nLoading identity ${IDENTITY_ID}...`);
    const identity = await client.platform.identities.get(IDENTITY_ID);
    if (!identity) {
      throw new Error(`Identity ${IDENTITY_ID} not found on testnet.`);
    }
    console.log(`Identity found. Credits: ${identity.getBalance()}`);

    // Define voucher document schema
    console.log('\nRegistering Data Contract...');
    const documentSchema = {
      voucher: {
        type: 'object',
        properties: {
          voucher_id: { type: 'string', maxLength: 63, position: 0 },
          status:     { type: 'string', maxLength: 16, position: 1 },
          tx_id:      { type: 'string', maxLength: 64, position: 2 },
          created_at: { type: 'string', maxLength: 32, position: 3 },
          redeemed_at:{ type: 'string', maxLength: 32, position: 4 }
        },
        additionalProperties: false,
        required: ['voucher_id', 'status', 'created_at'],
        indices: [
          {
            name: 'byVoucherId',
            properties: [{ voucher_id: 'asc' }],
            unique: true
          }
        ]
      }
    };

    const contract = await client.platform.contracts.create(documentSchema, identity);
    await client.platform.contracts.publish(contract, identity);

    const contractId = contract.getId().toString();
    console.log(`\n✓ Data Contract registered: ${contractId}`);

    // Append CONTRACT_ID to .env
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    if (envContent.includes('CONTRACT_ID=')) {
      // Replace existing value
      envContent = envContent.replace(/CONTRACT_ID=.*/, `CONTRACT_ID="${contractId}"`);
    } else {
      envContent += `\nCONTRACT_ID="${contractId}"\n`;
    }
    fs.writeFileSync(envPath, envContent);

    console.log(`✓ CONTRACT_ID saved to ${envPath}`);
    console.log('\n========================================');
    console.log('  DATA CONTRACT REGISTERED');
    console.log('========================================');
    console.log(`  Contract ID: ${contractId}`);
    console.log(`  Identity:    ${IDENTITY_ID}`);
    console.log('========================================');
    console.log('\nYou can now start the server with: node src/server.js');

  } catch (err) {
    console.error('\nError:', err.message || err);
  } finally {
    await client.disconnect();
  }
}

main();
