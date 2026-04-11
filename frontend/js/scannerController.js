document.addEventListener('DOMContentLoaded', () => {
  const statusBox = document.getElementById('statusBox');
  const redeemBtn = document.getElementById('redeemBtn');
  const scanAgainBtn = document.getElementById('scanAgainBtn');
  const readerDiv = document.getElementById('reader');
  
  const txPanel = document.getElementById('txPanel');
  const txIdDisplay = document.getElementById('txIdDisplay');
  const txAmountDisplay = document.getElementById('txAmountDisplay');
  const txTimeDisplay = document.getElementById('txTimeDisplay');
  
  const MERCHANT_WALLET = 'Xr9C2...mockWalletAddress...fB7v'; 
  let currentVoucherId = null;
  let html5QrcodeScanner = null;

  function setStatus(type, title, details = '') {
    // Reset classes
    statusBox.className = `status-box status-${type}`;
    
    statusBox.innerHTML = `
      ${title}
      ${details ? `<span class="status-details">${details}</span>` : ''}
    `;
    
    // Trigger transition
    statusBox.classList.add('show');
  }

  function hideStatus() {
    statusBox.classList.remove('show');
    txPanel.classList.remove('show');
    setTimeout(() => {
      statusBox.style.display = 'none';
      txPanel.style.display = 'none';
    }, 300);
  }

  async function handleScanSuccess(decodedText) {
    if (html5QrcodeScanner) {
      readerDiv.style.display = 'none';
      await html5QrcodeScanner.clear();
    }

    currentVoucherId = decodedText;
    
    // Ensure display block is set before adding fade-in class
    statusBox.style.display = 'block';
    
    try {
      const res = await ApiService.validateVoucher(currentVoucherId);
      
      if (res.success && res.status === 'VALID') {
        setStatus('valid', 'Valid Voucher', `${res.voucher.amount} DASH Available to Claim`);
        redeemBtn.style.display = 'block';
      } else if (res.status === 'REDEEMED') {
        setStatus('redeemed', 'Already Redeemed', 'This voucher has previously been claimed.');
        scanAgainBtn.style.display = 'block';
      } else {
        setStatus('invalid', 'Invalid Voucher', res.message);
        scanAgainBtn.style.display = 'block';
      }
    } catch (e) {
      setStatus('invalid', 'Connection Error', 'Failed to validate voucher with server.');
      scanAgainBtn.style.display = 'block';
    }
  }

  redeemBtn.addEventListener('click', async () => {
    if (!currentVoucherId) return;

    redeemBtn.disabled = true;
    redeemBtn.textContent = 'Processing payment...';

    try {
      const res = await ApiService.redeemVoucher(currentVoucherId, MERCHANT_WALLET);
      
      if (res.success) {
        // Hide standard status box
        statusBox.classList.remove('show');
        statusBox.style.display = 'none';
        
        // Populate and show the powerful txPanel
        txIdDisplay.textContent = res.tx_id;
        txAmountDisplay.textContent = res.amount + ' DASH';
        txTimeDisplay.textContent = new Date(res.timestamp).toLocaleTimeString();
        
        txPanel.style.display = 'flex';
        // Yield thread slightly so display:flex takes hold before animation
        setTimeout(() => txPanel.classList.add('show'), 10);
        
      } else {
        setStatus('invalid', 'Payment Failed', res.message);
      }
    } catch (e) {
      setStatus('invalid', 'Error', 'Failed to execute redemption protocol.');
    } finally {
      redeemBtn.style.display = 'none';
      redeemBtn.disabled = false;
      redeemBtn.textContent = 'Redeem Voucher';
      scanAgainBtn.style.display = 'block';
    }
  });

  scanAgainBtn.addEventListener('click', () => {
    hideStatus();
    scanAgainBtn.style.display = 'none';
    redeemBtn.style.display = 'none';
    currentVoucherId = null;
    startScanner();
  });

  function startScanner() {
    readerDiv.style.display = 'block';
    html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 15, qrbox: {width: 280, height: 280} }, false);
    html5QrcodeScanner.render(handleScanSuccess, () => {});
  }

  // Init
  startScanner();
});
