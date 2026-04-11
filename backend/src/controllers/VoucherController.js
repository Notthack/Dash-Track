const VoucherModel = require('../models/VoucherModel');
const DashPaymentService = require('../services/DashPaymentService');

class VoucherController {
  
  static async issueVoucher(req, res) {
    try {
      const { amount } = req.body;
      const voucher = await VoucherModel.create(amount);
      return res.status(201).json({
        success: true,
        message: 'Voucher issued successfully',
        voucher
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async validateVoucher(req, res) {
    try {
      const { voucher_id } = req.body;
      if (!voucher_id) {
        return res.status(400).json({ success: false, message: 'voucher_id is required' });
      }

      const voucher = await VoucherModel.findById(voucher_id);
      if (!voucher) {
        return res.status(404).json({ success: false, message: 'INVALID: Voucher does not exist', status: 'INVALID' });
      }

      if (voucher.status === 'REDEEMED') {
        return res.status(400).json({ success: false, message: 'INVALID: Voucher Already Redeemed', status: 'REDEEMED', voucher });
      }
      
      if (voucher.status === 'REVOKED') {
        return res.status(400).json({ success: false, message: 'INVALID: Voucher Revoked', status: 'REVOKED', voucher });
      }

      return res.status(200).json({
        success: true,
        message: 'Valid Voucher',
        status: 'VALID',
        voucher
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async redeemVoucher(req, res) {
    try {
      const { voucher_id, merchant_wallet } = req.body;
      
      if (!voucher_id || !merchant_wallet) {
        return res.status(400).json({ success: false, message: 'voucher_id and merchant_wallet are required' });
      }

      // Check validation again (crucial step for security)
      const voucher = await VoucherModel.findById(voucher_id);
      if (!voucher || voucher.status !== 'VALID') {
        return res.status(400).json({ success: false, message: 'Redemption failed: Voucher is not valid or already redeemed' });
      }

      // Trigger Dash Payment
      const paymentResult = await DashPaymentService.sendDashPayment(merchant_wallet, voucher.amount);

      if (paymentResult.success) {
        // Mark redeemed AFTER successful payment
        const redeemedVoucher = await VoucherModel.markRedeemed(voucher_id, paymentResult.tx_id);
        
        return res.status(200).json({
          success: true,
          tx_id: paymentResult.tx_id,
          amount: paymentResult.amount,
          timestamp: paymentResult.timestamp,
          message: 'Voucher successfully redeemed',
          voucher: redeemedVoucher
        });
      } else {
        return res.status(500).json({ success: false, message: 'Payment execution failed' });
      }

    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error during redemption', error: error.message });
    }
  }

  static async getTransactions(req, res) {
    try {
      const transactions = await VoucherModel.getAllTransactions();
      return res.status(200).json(transactions);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async revokeVoucher(req, res) {
    try {
      const { voucher_id } = req.body;
      if (!voucher_id) {
        return res.status(400).json({ success: false, message: 'voucher_id is required' });
      }

      const voucher = await VoucherModel.findById(voucher_id);
      if (!voucher) {
        return res.status(404).json({ success: false, message: 'Voucher does not exist' });
      }

      if (voucher.status === 'REDEEMED') {
        return res.status(400).json({ success: false, message: 'Cannot revoke a redeemed voucher' });
      }

      if (voucher.status === 'REVOKED') {
        return res.status(200).json({ success: true, message: 'Voucher is already revoked', status: 'REVOKED' });
      }

      await VoucherModel.markRevoked(voucher_id);

      return res.status(200).json({
        success: true,
        message: 'Voucher revoked successfully',
        status: 'REVOKED'
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = VoucherController;
