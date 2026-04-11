const http = require('http');

const request = (path, body) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api${path}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
};

(async () => {
  try {
    console.log('1. Issuing Voucher...');
    const issueRes = await request('/issue-voucher', { amount: 20 });
    console.log(issueRes);
    const voucher_id = issueRes.data.voucher.voucher_id;

    console.log('\n2. Validating Voucher...');
    const validateRes = await request('/validate-voucher', { voucher_id });
    console.log(validateRes);

    console.log('\n3. Redeeming Voucher...');
    const merchant_wallet = 'test_wallet_123';
    const redeemRes = await request('/redeem', { voucher_id, merchant_wallet });
    console.log(redeemRes);

    console.log('\n4. Validating Redeemed Voucher...');
    const valRedeemedRes = await request('/validate-voucher', { voucher_id });
    console.log(valRedeemedRes);

    console.log('\nAll tests passed.');
  } catch (error) {
    console.error('Test failed:', error);
  }
})();
