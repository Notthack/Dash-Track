/**
 * LocalStorage — In-memory Map storage for vouchers.
 * 
 * This is the fast, reliable fallback used when Dash Platform is
 * disabled or unavailable. Implements the VoucherStorage interface.
 */
const { v4: uuidv4 } = require('uuid');

const vouchers = new Map();

class LocalStorage {

  async createVoucher(amount) {
    const voucher_id = uuidv4();
    const voucher = {
      voucher_id,
      amount: amount || 10,
      status: 'VALID',
      tx_id: null,
      created_at: new Date().toISOString(),
      redeemed_at: null
    };
    vouchers.set(voucher_id, voucher);
    console.log(`[LocalStorage] Voucher ${voucher_id} created.`);
    return voucher;
  }

  async getVoucher(voucher_id) {
    return vouchers.get(voucher_id) || null;
  }

  async updateVoucher(voucher_id, data) {
    const voucher = vouchers.get(voucher_id);
    if (!voucher) throw new Error('Voucher not found');
    Object.assign(voucher, data);
    return voucher;
  }

  async getAllVouchers() {
    return Array.from(vouchers.values());
  }
}

module.exports = LocalStorage;
