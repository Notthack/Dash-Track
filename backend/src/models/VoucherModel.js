const { v4: uuidv4 } = require('uuid');

// In-memory storage for MVP
const vouchers = new Map();

class VoucherModel {
  static create(amount) {
    const voucher_id = uuidv4();
    const voucher = {
      voucher_id,
      amount: amount || 10, // default 10 Dash for demo
      status: 'VALID',
      tx_id: null,
      created_at: new Date().toISOString(),
      redeemed_at: null
    };
    vouchers.set(voucher_id, voucher);
    return voucher;
  }

  static findById(id) {
    return vouchers.get(id);
  }

  static markRedeemed(id, tx_id) {
    const voucher = vouchers.get(id);
    if (!voucher) throw new Error('Voucher not found');
    if (voucher.status !== 'VALID') throw new Error('Voucher is not valid');
    
    voucher.status = 'REDEEMED';
    voucher.tx_id = tx_id || null;
    voucher.redeemed_at = new Date().toISOString();
    return voucher;
  }

  static markRevoked(id) {
    const voucher = vouchers.get(id);
    if (!voucher) throw new Error('Voucher not found');
    voucher.status = 'REVOKED';
    return voucher;
  }

  static getAllTransactions() {
    return Array.from(vouchers.values())
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
