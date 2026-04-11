/**
 * AdminController — Manages the Sponsor (Admin) view logic.
 */
const AdminController = (() => {
  let pollingInterval = null;
  let initialized = false;

  function initAdmin() {
    if (initialized) return;
    initialized = true;

    const issueBtn = document.getElementById('issueBtn');

    issueBtn.addEventListener('click', async () => {
      try {
        issueBtn.disabled = true;
        issueBtn.textContent = 'Generating...';

        const result = await ApiService.issueVoucher(10);

        if (result.success) {
          // Delegate entirely to the unified voucher card engine
          AppController.renderVoucherPreview(result.voucher.voucher_id, 10);
        } else {
          alert('Failed to issue voucher: ' + result.message);
        }
      } catch (error) {
        console.error(error);
        alert('Network error communicating with the API.');
      } finally {
        issueBtn.disabled = false;
        issueBtn.textContent = 'Generate Voucher (10 DASH)';
      }
    });

    const revokeBtn = document.getElementById('revokeBtn');
    const revokeInput = document.getElementById('revokeInput');

    revokeBtn.addEventListener('click', async () => {
      const voucherId = revokeInput.value.trim();
      if (!voucherId) {
        alert('Please enter a voucher ID');
        return;
      }

      try {
        revokeBtn.disabled = true;
        revokeBtn.textContent = 'Revoking...';

        const result = await ApiService.revokeVoucher(voucherId);

        if (result.success) {
          AppController.showToast('Voucher revoked successfully', 'info');
          revokeInput.value = '';
          fetchTransactions();
        } else {
          alert('ERROR: ' + result.message);
        }
      } catch (error) {
        console.error(error);
        alert('Network error communicating with the API.');
      } finally {
        revokeBtn.disabled = false;
        revokeBtn.textContent = 'Revoke';
      }
    });

    // Start polling
    fetchTransactions();
    pollingInterval = setInterval(fetchTransactions, 3000);
  }

  async function fetchTransactions() {
    const txTableBody = document.getElementById('txTableBody');
    if (!txTableBody) return;

    try {
      const txs = await ApiService.getTransactions();
      txTableBody.innerHTML = '';

      txs.forEach(tx => {
        const tr = document.createElement('tr');

        // Requirement 6: Display FULL voucher_id
        const voucherId = tx.voucher_id;
        const shortTxId = tx.tx_id ? tx.tx_id : '-';
        const timeStr = new Date(tx.timestamp).toLocaleTimeString();

        tr.innerHTML = `
          <td class="monospace">
            ${voucherId}
            <button class="copy-btn" data-id="${voucherId}" title="Copy ID">
              <svg class="copy-btn__icon" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          </td>
          <td><span class="status-pill ${tx.status}">${tx.status}</span></td>
          <td class="monospace">${shortTxId}</td>
          <td>${timeStr}</td>
          <td>
            <button class="action-preview" data-id="${voucherId}" data-amount="10">Preview</button>
          </td>
        `;

        // Bind copy button — dual-path for desktop + mobile compatibility
        const copyBtn = tr.querySelector('.copy-btn');
        copyBtn.addEventListener('click', async () => {
          const originalContent = copyBtn.innerHTML;

          const success = await copyToClipboard(voucherId);

          if (success) {
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            copyBtn.disabled = true;

            setTimeout(() => {
              copyBtn.innerHTML = originalContent;
              copyBtn.classList.remove('copied');
              copyBtn.disabled = false;
            }, 1500);

            AppController.showToast('Voucher ID copied!', 'success');
          } else {
            AppController.showToast('Copy failed — please copy manually.', 'error');
          }
        });

        // Bind preview button (Requirement 8)
        tr.querySelector('.action-preview').addEventListener('click', () => {
          AppController.openVoucherModal(voucherId, 10);
        });

        txTableBody.appendChild(tr);
      });
    } catch (e) {
      console.error('Failed to fetch transactions', e);
    }
  }

  function destroyAdmin() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    initialized = false;
  }

  return { initAdmin, destroyAdmin, fetchTransactions };
})();
