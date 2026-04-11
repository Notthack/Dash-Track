/**
 * AppController — SPA orchestrator for the Role-Based UI.
 */

/**
 * copyToClipboard — Cross-browser clipboard utility.
 *
 * Desktop Chrome/Edge on HTTP (non-HTTPS) may block the modern Clipboard API
 * with a NotAllowedError even inside a user gesture. This falls back to the
 * legacy textarea + execCommand('copy') which works universally.
 *
 * @param {string} text — The string to copy.
 * @returns {Promise<boolean>} — true if copy succeeded, false otherwise.
 */
async function copyToClipboard(text) {
  // Path 1: Modern Clipboard API (HTTPS or localhost with focus)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      // Fall through to legacy path
    }
  }

  // Path 2: Legacy execCommand fallback (works on HTTP desktop)
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch (_) {
    return false;
  }
}

const AppController = (() => {

  /* ───── Role Configuration ───── */
  const ROLES = {
    'sponsor:uon': { type: 'sponsor', name: 'University of Nottingham', label: 'Sponsor', program: 'Student Giveaway' },
    'sponsor:ngo': { type: 'sponsor', name: 'NGO', label: 'Sponsor', program: 'Aid & Support Program' },
    'merchant:7eleven': { type: 'merchant', name: 'SevenEleven', label: 'Merchant' },
    'merchant:murni': { type: 'merchant', name: 'Murni Discovery', label: 'Merchant' }
  };

  let currentRole = null;
  let currentView = null; // 'sponsor' or 'merchant'

  /* ───── DOM References (lazy) ───── */
  const el = (id) => document.getElementById(id);

  /* ───── Role Switching ───── */
  function switchRole(roleKey) {
    const role = ROLES[roleKey];
    if (!role) return;
    currentRole = role;

    const roleLabel = el('roleLabel');
    if (roleLabel) {
      roleLabel.innerHTML = `<span class="role-label__icon">${role.type === 'sponsor' ? '🏛️' : '🏪'}</span> 
        <span class="role-label__text">${role.name}</span>
        <span class="role-label__badge">${role.label}</span>`;
    }

    if (role.type === 'sponsor') { showSponsorView(); } 
    else { showMerchantView(); }
  }

  function showSponsorView() {
    if (currentView === 'merchant') ScannerController.stopScanner();
    currentView = 'sponsor';
    el('sponsor-view').style.display = 'block';
    el('merchant-view').style.display = 'none';
    el('sponsor-view').classList.add('view--active');
    AdminController.initAdmin();
    document.title = 'Sure Vouch — Admin Station';
  }

  function showMerchantView() {
    AdminController.destroyAdmin();
    currentView = 'merchant';
    el('sponsor-view').style.display = 'none';
    el('merchant-view').style.display = 'block';
    el('merchant-view').classList.add('view--active');
    if (el('merchantLabel')) el('merchantLabel').textContent = `Merchant: ${currentRole.name}`;
    ScannerController.initScanner();
    document.title = 'Sure Vouch — Merchant Scanner';
  }

  /* ───── Tab Navigation ───── */
  function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
    document.querySelectorAll('.tab-content').forEach(panel => panel.classList.toggle('active', panel.id === `tab-${tabName}`));
  }

  /* ───── Voucher Card Engine (Unified) ───── */
  function renderVoucherCard(container, voucherId, amount) {
    // Shared state
    const sponsorName = currentRole ? currentRole.name : 'Sponsor';
    const programName = currentRole ? currentRole.program : 'Voucher Program';
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 3);
    const validStr = validUntil.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
    
    const shortId = `ID: ${voucherId.substring(0, 4)}...${voucherId.substring(voucherId.length - 4)}`;

    // Build internal HTML structure
    container.innerHTML = `
      <div class="voucher-card voucher-card--visible" style="display: flex;">
        <div class="voucher-card__header" style="justify-content: space-between; width: 100%;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <img src="assets/surevouch_logo.png" alt="Sure Vouch" class="voucher-card__logo" style="filter: none;">
            <span style="font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 1.1rem; color: #fff;">Sure Vouch</span>
          </div>
          <span style="font-size: 0.65rem; color: rgba(255,255,255,0.4); font-weight: 700; text-transform: uppercase;">Powered by Dash</span>
        </div>
        <div class="voucher-card__body">
          <div class="voucher-card__info">
            <span class="voucher-card__label">SPONSORED BY</span>
            <span class="voucher-card__sponsor">${sponsorName}</span>
            <span class="voucher-card__label voucher-card__label--value">VOUCHER VALUE</span>
            <span class="voucher-card__amount">${amount} DASH</span>
            <span class="voucher-card__program">${programName}</span>
          </div>
          <div class="voucher-card__qr"></div>
        </div>
        <div class="voucher-card__footer">
          <div style="display: flex; flex-direction: column;">
            <span class="voucher-card__valid">VALID UNTIL: ${validStr}</span>
            <span class="voucher-card__id-tag">${shortId}</span>
          </div>
          <span class="voucher-card__shield">🛡️</span>
        </div>
        <button class="print-btn pill-btn">🖨️ Print Voucher</button>
      </div>
    `;

    // Render QR into the generated .voucher-card__qr block
    const qrTarget = container.querySelector('.voucher-card__qr');
    new QRCode(qrTarget, {
      text: voucherId,
      width: 160,
      height: 160,
      colorDark: '#000000',  // Standard dark modules — required for scanner compatibility
      colorLight: '#ffffff', // White background — matches .voucher-card__qr { background: white }
      correctLevel: QRCode.CorrectLevel.H
    });
  }

  /* ───── Specific Previews ───── */
  function renderVoucherPreview(voucherId, amount) {
    const previewArea = el('voucherPreview');
    if (!previewArea) return;

    // Clear any previous render before injecting fresh card
    previewArea.innerHTML = '';

    // Render using central engine
    renderVoucherCard(previewArea, voucherId, amount);

    // Wire up the print button that renderVoucherCard injected
    const printBtn = previewArea.querySelector('.print-btn');
    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }
  }

  function openVoucherModal(voucherId, amount) {
    const modal = el('voucherModal');
    const container = el('modalVoucherContainer');
    if (!modal || !container) return;

    renderVoucherCard(container, voucherId, amount);
    modal.classList.add('open');

    // Close on backdrop click
    const backdropListener = (e) => {
      if (e.target === modal) {
        closeVoucherModal();
        modal.removeEventListener('click', backdropListener);
      }
    };
    modal.addEventListener('click', backdropListener);
  }

  function closeVoucherModal() {
    const modal = el('voucherModal');
    if (modal) modal.classList.remove('open');
  }

  /* ───── Feedback System ───── */
  function showToast(message, type = 'info') {
    const container = el('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('toast--exit'); setTimeout(() => toast.remove(), 400); }, 3000);
  }

  /* ───── Init ───── */
  function init() {
    // Role binding
    const roleSelect = el('roleSelect');
    if (roleSelect) {
      roleSelect.addEventListener('change', (e) => switchRole(e.target.value));
      switchRole(roleSelect.value);
    }

    // Tab binding
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Modal Close
    if (el('closeModal')) el('closeModal').addEventListener('click', closeVoucherModal);

    // Escape key for modal
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeVoucherModal(); });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { 
    switchRole, switchTab, renderVoucherPreview, openVoucherModal, closeVoucherModal, showToast,
    getCurrentRole: () => currentRole 
  };
})();
