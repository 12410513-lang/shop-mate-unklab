// ============================================================================
// ADMIN — menu & fungsi bantu
// ============================================================================

const ADMIN_MENU = [
  ['a-dash', 'Dashboard'],
  ['a-user', 'Kelola Pengguna'],
  ['a-produk', 'Kelola Produk'],
  ['a-kat', 'Kelola Kategori'],
  ['a-trx', 'Transaksi'],
  ['a-profil', 'Profil'],
];

const adminShell = (currentPage, bodyHtml) => dashboardShell(ADMIN_MENU, currentPage, bodyHtml);

const isCategoryUsed = (categoryName) => PRODUCTS.some((product) => product.category == categoryName);

const openTransaction = (orderNo) => `state.selectedTrxOrderNo='${orderNo}';go('a-trxd')`;

// Kumpulan tombol aksi dalam sel tabel
const actionButtons = (...buttons) => `<div class="admin-actions">${buttons.join('')}</div>`;
