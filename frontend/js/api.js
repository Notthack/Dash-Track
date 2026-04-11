const API_URL = '/api';

const ApiService = {
  async issueVoucher(amount) {
    const res = await fetch(`${API_URL}/issue-voucher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    return res.json();
  },

  async validateVoucher(voucher_id) {
    const res = await fetch(`${API_URL}/validate-voucher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voucher_id })
    });
    return res.json();
  },

  async redeemVoucher(voucher_id, merchant_wallet) {
    const res = await fetch(`${API_URL}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voucher_id, merchant_wallet })
    });
    return res.json();
  },

  async getTransactions() {
    const res = await fetch(`${API_URL}/transactions`);
    return res.json();
  },

  async revokeVoucher(voucher_id) {
    const res = await fetch(`${API_URL}/revoke-voucher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voucher_id })
    });
    return res.json();
  }
};
