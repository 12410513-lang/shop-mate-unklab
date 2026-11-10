// ============================================================================
// NOTIFIKASI (lonceng) — dipakai Pembeli dan Penjual
// item = { text, time, action? }  → action = kode onclick (opsional)
// scope = pemilik notifikasi, agar status "sudah dibaca" tidak tertukar antar akun
// ============================================================================

const readNotifications = new Set();
const notificationTexts = {};   // scope → daftar teks yang sedang ditampilkan

function notificationRow(item, scope) {
  const isNew = !readNotifications.has(scope + item.text);
  const clickable = item.action ? `onclick="${item.action}"` : '';
  const rowStyle =
    (item.action ? 'cursor:pointer;' : '') +
    (isNew ? 'background:var(--primary-soft);border-radius:6px;padding-left:6px' : '');

  return `
    <div class="row" ${clickable} style="${rowStyle}">
      <div class="g">
        ${isNew ? '<span class="tag" style="margin-right:6px">Baru</span>' : ''}${item.text}
        <div class="mu">${item.time}</div>
      </div>
    </div>`;
}

function notificationBell(items, scope) {
  notificationTexts[scope] = items.map((item) => item.text);
  const unreadCount = items.filter((item) => !readNotifications.has(scope + item.text)).length;

  return `
    <span style="position:relative">
      <button class="btn o s" id="nb" onclick="toggleNotifications('${scope}')">
        Notifikasi${unreadCount ? ` (${unreadCount})` : ''}
      </button>
      <div class="card pnl" id="np" hidden>
        <b>Notifikasi</b>
        ${items.map((item) => notificationRow(item, scope)).join('') || '<p class="mu">Belum ada notifikasi.</p>'}
      </div>
    </span>`;
}

function toggleNotifications(scope) {
  const panel = $('#np');
  panel.hidden = !panel.hidden;

  if (!panel.hidden) {
    notificationTexts[scope].forEach((text) => readNotifications.add(scope + text));
    $('#nb').textContent = 'Notifikasi';
  }
}
