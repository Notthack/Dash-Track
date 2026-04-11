/**
 * DashPlatformStorage — Stores vouchers on Dash Drive via DAPI.
 * 
 * Wraps every operation in try/catch with timeout protection.
 * On failure, delegates to the LocalStorage fallback so the demo
 * never crashes regardless of testnet conditions.
 * 
 * Implements the same interface as LocalStorage (Strategy pattern).
 */
const { v4: uuidv4 } = require('uuid');
const dashClient = require('../config/dashClient');
const LocalStorage = require('./LocalStorage');

const DAPI_TIMEOUT_MS = 5000;

// Shared local fallback instance for when DAPI calls fail
const localFallback = new LocalStorage();

/**
 * Race a promise against a timeout. Returns the promise result
 * or rejects with a timeout error.
 */
function withTimeout(promise, ms = DAPI_TIMEOUT_MS) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('DAPI Timeout')), ms)
  );
  return Promise.race([promise, timeout]);
}

class DashPlatformStorage {

  async createVoucher(amount) {
    // Always write locally first (instant, reliable)
    const voucher = await localFallback.createVoucher(amount);

    if (!dashClient.isReady()) return voucher;

    try {
      const client = dashClient.getClient();
      const identity = await withTimeout(
        client.platform.identities.get(dashClient.getIdentityId())
      );

      const doc = await client.platform.documents.create(
        'VoucherApp.voucher',
        identity,
        {
          voucher_id: voucher.voucher_id,
          status: 'VALID',
          tx_id: 'NULL',
          created_at: voucher.created_at,
          redeemed_at: 'NULL'
        }
      );

      await withTimeout(
        client.platform.documents.broadcast({ create: [doc] }, identity),
        8000 // broadcasts can take longer
      );

      console.log(`[DashDrive] ✓ Voucher ${voucher.voucher_id} stored on Dash Platform.`);
    } catch (err) {
      console.error(`[DashDrive] ✗ Write failed (${err.message}). Local copy preserved.`);
    }

    return voucher;
  }

  async getVoucher(voucher_id) {
    if (!dashClient.isReady()) {
      return localFallback.getVoucher(voucher_id);
    }

    try {
      const client = dashClient.getClient();
      const docs = await withTimeout(
        client.platform.documents.get('VoucherApp.voucher', {
          where: [['voucher_id', '==', voucher_id]],
        })
      );

      if (docs && docs.length > 0) {
        const driveData = docs[0].toJSON();
        console.log(`[DashDrive] ✓ Voucher ${voucher_id} read from Dash Platform.`);

        // Build normalised voucher and sync to local cache
        const localVoucher = await localFallback.getVoucher(voucher_id);
        const synced = {
          ...(localVoucher || {}),
          voucher_id: driveData.voucher_id,
          status: driveData.status,
          tx_id: driveData.tx_id === 'NULL' ? null : driveData.tx_id,
          created_at: driveData.created_at,
          redeemed_at: driveData.redeemed_at === 'NULL' ? null : driveData.redeemed_at,
        };

        // Keep local cache in sync
        await localFallback.updateVoucher(voucher_id, synced).catch(() => {});
        return synced;
      }

      console.log(`[DashDrive] Voucher ${voucher_id} not found on Drive. Checking local...`);
    } catch (err) {
      console.error(`[DashDrive] ✗ Read failed (${err.message}). Using local fallback.`);
    }

    return localFallback.getVoucher(voucher_id);
  }

  async updateVoucher(voucher_id, data) {
    // Always update locally first
    const voucher = await localFallback.updateVoucher(voucher_id, data);

    if (!dashClient.isReady()) return voucher;

    try {
      const client = dashClient.getClient();
      const identity = await withTimeout(
        client.platform.identities.get(dashClient.getIdentityId())
      );

      const docs = await withTimeout(
        client.platform.documents.get('VoucherApp.voucher', {
          where: [['voucher_id', '==', voucher_id]],
        })
      );

      if (docs && docs.length > 0) {
        const docToUpdate = docs[0];
        if (data.status) docToUpdate.set('status', data.status);
        if (data.tx_id !== undefined) docToUpdate.set('tx_id', data.tx_id || 'NULL');
        if (data.redeemed_at) docToUpdate.set('redeemed_at', data.redeemed_at);

        await withTimeout(
          client.platform.documents.broadcast({ replace: [docToUpdate] }, identity),
          8000
        );

        console.log(`[DashDrive] ✓ Voucher ${voucher_id} updated on Dash Platform.`);
      }
    } catch (err) {
      console.error(`[DashDrive] ✗ Update failed (${err.message}). Local copy updated safely.`);
    }

    return voucher;
  }

  async getAllVouchers() {
    // Transactions list always reads from local for speed
    return localFallback.getAllVouchers();
  }
}

module.exports = DashPlatformStorage;
