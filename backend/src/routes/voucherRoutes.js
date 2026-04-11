const express = require('express');
const router = express.Router();
const VoucherController = require('../controllers/VoucherController');

router.post('/issue-voucher', VoucherController.issueVoucher);
router.post('/validate-voucher', VoucherController.validateVoucher);
router.post('/redeem', VoucherController.redeemVoucher);
router.post('/revoke-voucher', VoucherController.revokeVoucher);
router.get('/transactions', VoucherController.getTransactions);

module.exports = router;
