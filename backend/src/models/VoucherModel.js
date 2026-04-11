/**
 * VoucherModel — Thin facade over the active storage strategy.
 * 
 * Business rules (status validation, state transitions) live here.
 * Persistence is delegated entirely to the storage layer.
 * 
 * The model never imports Dash SDK directly — clean separation of concerns.
 */
const { getStorage } = require('../storage/StorageFactory');

class VoucherModel {

  static async create(amount) {
    const storage = getStorage();
    return storage.createVoucher(amount);
  }

  static async findById(id) {
    const storage = getStorage();
    return storage.getVoucher(id);
  }

  static async markRedeemed(id, tx_id) {
    const storage = getStorage();
    const voucher = await storage.getVoucher(id);
    if (!voucher) throw new Error('Voucher not found');
    if (voucher.status !== 'VALID') throw new Error('Voucher is not valid');

    return storage.updateVoucher(id, {
      status: 'REDEEMED',
      tx_id: tx_id || null,
      redeemed_at: new Date().toISOString()
    });
  }

  static async markRevoked(id) {
    const storage = getStorage();
    const voucher = await storage.getVoucher(id);
    if (!voucher) throw new Error('Voucher not found');

    return storage.updateVoucher(id, { status: 'REVOKED' });
  }

  static async getAllTransactions() {
    const storage = getStorage();
    const all = await storage.getAllVouchers();
    return all
      .map(v => ({
        voucher_id: v.voucher_id,
        status: v.status,
        tx_id: v.tx_id,
        timestamp: v.redeemed_at || v.created_at
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
  }
}

module.exports = VoucherModel;
