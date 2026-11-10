// ============================================================================
// KOMPONEN UI BERSAMA — dipakai oleh Pembeli, Penjual, dan Administrator
// ============================================================================

// ----- Notifikasi toast -----
function toast(message) {
  const element = document.createElement('div');
  element.className = 'toast';
  element.textContent = message;
  document.body.append(element);
  setTimeout(() => element.remove(), 2800);
}

// ----- Tag / lencana status -----
const TAG_STYLE = {
  Menunggu: 'wn',
  Diproses: '',
  'Siap Diambil/Dikirim': 'ok',
  Selesai: 'ok',
  Aktif: 'ok',
  Nonaktif: 'er',
  Tersembunyi: 'wn',
};

const tag = (text) => `<span class="tag ${TAG_STYLE[text] || ''}">${text}</span>`;

// ----- Kolom formulir dengan ikon -----
function formField(icon, label, placeholder, type = 'text', id = '', value = '') {
  const showPasswordButton =
    type === 'password'
      ? `<button type="button" class="eye" aria-label="Tampilkan kata sandi"
           onclick="togglePasswordVisibility(this)">${ICONS.eye}</button>`
      : '';

  return `
    <label class="f">${label}
      <span class="in">
        ${ICONS[icon]}
        <input type="${type}" placeholder="${placeholder}" id="${id}" value="${escapeHtml(value)}">
        ${showPasswordButton}
      </span>
    </label>`;
}

function togglePasswordVisibility(button) {
  const input = button.parentNode.querySelector('input');
  input.type = input.type == 'password' ? 'text' : 'password';
}

// ----- Gambar produk (jatuh ke huruf awal bila gambar tidak ada) -----
const productImage = (product) =>
  product && product.image
    ? `<img src="${product.image}" alt="${product.name}"
         style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"
         onerror="this.remove()">`
    : '';

const thumbnail = (productName, size = 36) => `
  <div class="ph th" style="width:${size}px;height:${size}px;position:relative;overflow:hidden">
    ${productName[0]}${productImage(PRODUCTS.find((product) => product.name == productName))}
  </div>`;

// ----- Tabel -----
function table(headers, rows, emptyText = 'Belum ada data.') {
  if (!rows.length) return `<div class="card mu">${emptyText}</div>`;

  const headerCells = headers.map((header) => `<th>${header}</th>`).join('');
  const bodyRows = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
    .join('');

  return `
    <div class="tw card" style="padding:4px 8px">
      <table><tr>${headerCells}</tr>${bodyRows}</table>
    </div>`;
}

// ----- Kartu statistik -----
const statCard = (label, value) => `
  <div class="card stat"><span class="mu">${label}</span><b>${value}</b></div>`;

// ----- Toggle visibilitas -----
const toggleSwitch = (isOn, onclick) =>
  `<button class="tgl ${isOn ? 'on' : ''}" aria-label="Atur visibilitas" onclick="${onclick}"></button>`;

// ----- Shell dengan sidebar (Penjual & Administrator) -----
// menu = [[kunciHalaman, label], ...]
function dashboardShell(menu, currentPage, bodyHtml) {
  const menuButtons = menu
    .map(([page, label]) =>
      `<button class="${page == currentPage ? 'on' : ''}" onclick="go('${page}')">${label}</button>`)
    .join('');

  return `
    <div class="shell">
      <aside class="side">
        <div class="lg">${logo(1, true)}</div>
        ${menuButtons}
        <button class="lo" onclick="logout()">Logout</button>
      </aside>
      <div class="main">${bodyHtml}</div>
    </div>`;
    const backButton = () =>
  state.history.length
    ? `<button type="button" class="btn-back" onclick="goBack()">← Kembali</button>`
    : '';
    
}

