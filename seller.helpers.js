// ============================================================================
// SELLER — menu & fungsi bantu
// ============================================================================

const SELLER_MENU = [
  ['s-dash', 'Dashboard'],
  ['s-produk', 'Kelola Produk'],
  ['s-pesanan', 'Pesanan'],
  ['s-laporan', 'Laporan Penjualan'],
  ['s-profil', 'Profil Penjual'],
];

const sellerShell = (currentPage, bodyHtml) => dashboardShell(SELLER_MENU, currentPage, bodyHtml);

// Data milik penjual yang sedang login
const sellerProducts = () => PRODUCTS.filter((product) => product.seller == state.user.name);
const sellerOrders = () => ORDERS.filter((order) => order.seller == state.user.name);

// Notifikasi penjual: hanya untuk toko sendiri; klik membuka detail pesanan
const sellerNotifications = () =>
  NOTIFICATIONS
    .filter((notification) => notification.seller == state.user.name)
    .map((notification) => ({
      text: notification.text,
      time: notification.time,
      action: `state.selectedOrderNo='${notification.orderNo}';go('s-pesanan')`,
    }));

// Judul halaman + lonceng notifikasi
const sellerHeader = (title) => `
  <div class="hdr">
    <h2 style="margin:0;flex:1">${title}</h2>
    ${notificationBell(sellerNotifications(), 's:' + state.user.email)}
  </div>`;
