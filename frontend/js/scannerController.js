/**
 * ScannerController — Manages the Merchant QR scanning view.
 *
 * Exposes:
 *   initScanner()  — Start the camera and QR scanner.
 *   stopScanner()  — Safely stop the camera and clean up.
 *
 * The SPA orchestrator (app.js) MUST call stopScanner() when
 * leaving the Merchant view to prevent camera freezes.
 */
const ScannerController = (() => {
  let html5QrcodeScanner = null;
  let currentVoucherId = null;
  let initialized = false;
  let eventsAttached = false;

  function getMerchantWallet() {
    // In a real system this would come from a config.
    // For the demo, use a mock wallet based on the active merchant role.
    return 'Xr9C2...mockWalletAddress...fB7v';
  }

  function setStatus(type, title, details = '') {
    const statusBox = document.getElementById('statusBox');
    if (!statusBox) return;

    statusBox.className = `status-box status-${type}`;
    statusBox.innerHTML = `
      ${title}
      ${details ? `<span class="status-details">${details}</span>` : ''}
    `;
    statusBox.style.display = 'block';
    statusBox.classList.add('show');
  }

  function hideStatus() {
    const statusBox = document.getElementById('statusBox');
    const txPanel = document.getElementById('txPanel');
    if (!statusBox) return;

    statusBox.classList.remove('show');
    if (txPanel) txPanel.classList.remove('show');

    setTimeout(() => {
      statusBox.style.display = 'none';
      if (txPanel) txPanel.style.display = 'none';
    }, 300);
  }

  async function handleScanSuccess(decodedText) {
    const readerDiv = document.getElementById('reader');
    const redeemBtn = document.getElementById('redeemBtn');
    const scanAgainBtn = document.getElementById('scanAgainBtn');
    const statusBox = document.getElementById('statusBox');

    if (html5QrcodeScanner) {
      readerDiv.style.display = 'none';
      try {
        await html5QrcodeScanner.clear();
      } catch (e) {
        console.warn('[Scanner] Clear failed:', e.message);
      }
      html5QrcodeScanner = null;
    }

    currentVoucherId = decodedText;
    statusBox.style.display = 'block';

    try {
      const res = await ApiService.validateVoucher(currentVoucherId);

      if (res.success && res.status === 'VALID') {
        setStatus('valid', 'Valid Voucher', `${res.voucher.amount} DASH Available to Claim`);
        redeemBtn.style.display = 'block';
      } else if (res.status === 'REDEEMED') {
        setStatus('redeemed', 'Already Redeemed', 'This voucher has previously been claimed.');
        scanAgainBtn.style.display = 'block';
      } else if (res.status === 'REVOKED') {
        setStatus('revoked', '❌ Voucher Revoked', 'This voucher has been invalidated by an administrator.');
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

  function attachEvents() {
    if (eventsAttached) return;
    eventsAttached = true;

    const redeemBtn = document.getElementById('redeemBtn');
    const scanAgainBtn = document.getElementById('scanAgainBtn');
    const statusBox = document.getElementById('statusBox');
    const txPanel = document.getElementById('txPanel');

    redeemBtn.addEventListener('click', async () => {
      if (!currentVoucherId) return;

      redeemBtn.disabled = true;
      redeemBtn.textContent = 'Processing payment...';

      try {
        const res = await ApiService.redeemVoucher(currentVoucherId, getMerchantWallet());

        if (res.success) {
          statusBox.classList.remove('show');
          statusBox.style.display = 'none';

          document.getElementById('txIdDisplay').textContent = res.tx_id;
          document.getElementById('txAmountDisplay').textContent = res.amount + ' DASH';
          document.getElementById('txTimeDisplay').textContent = new Date(res.timestamp).toLocaleTimeString();

          txPanel.style.display = 'flex';
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
      startCamera();
    });
  }

  function startCamera() {
    const readerDiv = document.getElementById('reader');
    if (!readerDiv) return;

    readerDiv.style.display = 'block';
    html5QrcodeScanner = new Html5QrcodeScanner(
      'reader',
      { fps: 15, qrbox: { width: 280, height: 280 } },
      false
    );
    html5QrcodeScanner.render(handleScanSuccess, () => {});
  }

  function initScanner() {
    if (initialized) return;
    initialized = true;

    attachEvents();
    startCamera();
    console.log('[Scanner] ✓ Camera started');
  }

  async function stopScanner() {
    if (html5QrcodeScanner) {
      try {
        await html5QrcodeScanner.clear();
        console.log('[Scanner] ✓ Camera stopped');
      } catch (e) {
        console.warn('[Scanner] Stop warning:', e.message);
      }
      html5QrcodeScanner = null;
    }

    // Reset UI state so it's clean on re-entry
    const readerDiv = document.getElementById('reader');
    const redeemBtn = document.getElementById('redeemBtn');
    const scanAgainBtn = document.getElementById('scanAgainBtn');
    const statusBox = document.getElementById('statusBox');
    const txPanel = document.getElementById('txPanel');

    if (readerDiv) readerDiv.style.display = 'none';
    if (redeemBtn) redeemBtn.style.display = 'none';
    if (scanAgainBtn) scanAgainBtn.style.display = 'none';
    if (statusBox) { statusBox.style.display = 'none'; statusBox.classList.remove('show'); }
    if (txPanel) { txPanel.style.display = 'none'; txPanel.classList.remove('show'); }

    currentVoucherId = null;
    initialized = false;
  }

  return { initScanner, stopScanner };
})();
