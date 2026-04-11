document.addEventListener('DOMContentLoaded', () => {
  const issueBtn = document.getElementById('issueBtn');
  const qrWrapper = document.getElementById('qrWrapper');
  const qrcodeDiv = document.getElementById('qrcode');
  const voucherIdDisplay = document.getElementById('voucherIdDisplay');

  issueBtn.addEventListener('click', async () => {
    try {
      issueBtn.disabled = true;
      issueBtn.textContent = 'Generating...';
      
      // Hides existing QR cleanly to swap with new
      qrWrapper.style.display = 'none';
      qrcodeDiv.innerHTML = '';

      const result = await ApiService.issueVoucher(10);
      
      if (result.success) {
        const voucherId = result.voucher.voucher_id;
        
        new QRCode(qrcodeDiv, {
          text: voucherId,
          width: 256,
          height: 256,
          colorDark : "#0f172a",
          colorLight : "#ffffff",
          correctLevel : QRCode.CorrectLevel.H
        });

        voucherIdDisplay.textContent = `${voucherId}`;
        qrWrapper.style.display = 'flex';
      } else {
        alert('Failed to issue voucher: ' + result.message);
      }
    } catch (error) {
      console.error(error);
      alert('Network error communicating with the API.');
    } finally {
      issueBtn.disabled = false;
      issueBtn.textContent = 'Generate New QR';
    }
  });

  const txTableBody = document.getElementById('txTableBody');
  
  async function fetchTransactions() {
    try {
      const txs = await ApiService.getTransactions();
      txTableBody.innerHTML = '';
      
      txs.forEach(tx => {
        const tr = document.createElement('tr');
        
        const shortVoucherId = tx.voucher_id.split('-')[0] + '...';
        const shortTxId = tx.tx_id ? tx.tx_id : '-';
        const timeStr = new Date(tx.timestamp).toLocaleTimeString();
        
        tr.innerHTML = `
          <td class="monospace">${shortVoucherId}</td>
          <td><span class="status-pill ${tx.status}">${tx.status}</span></td>
          <td class="monospace">${shortTxId}</td>
          <td>${timeStr}</td>
        `;
        txTableBody.appendChild(tr);
      });
    } catch(e) {
      console.error('Failed to fetch transactions', e);
    }
  }

  // Fetch immediately and poll every 2 seconds
  fetchTransactions();
  setInterval(fetchTransactions, 2000);
});
