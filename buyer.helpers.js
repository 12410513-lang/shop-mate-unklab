// ============================================================================
// BUYER — fungsi bantu (keranjang, filter katalog, komponen tampilan)
// ============================================================================

// ----- Keranjang -----
const cartCount = () => state.cart.reduce((sum, item) => sum + item.qty, 0);

const cartTotal = () =>
  state.cart.reduce((sum, item) => sum + findProduct(item.id).price * item.qty, 0);

// Buang item yang produknya sudah tidak tersedia & batasi jumlah sesuai stok
function syncCart() {
  state.cart = state.cart.filter((item) => {
    const product = findProduct(item.id);
    return product && isVisibleProduct(product) && product.stock > 0;
  });
  state.cart.forEach((item) => {
    item.qty = Math.min(item.qty, findProduct(item.id).stock);
  });
}

// ----- Filter katalog -----
function filteredProducts() {
  let products = PRODUCTS.filter(isVisibleProduct);

  if (state.query) {
    const keyword = state.query.toLowerCase();
    products = products.filter((p) => (p.name + p.category).toLowerCase().includes(keyword));
  }
  if (state.category != 'Semua') products = products.filter((p) => p.category == state.category);
  if (state.priceMin) products = products.filter((p) => p.price >= +state.priceMin);
  if (state.priceMax) products = products.filter((p) => p.price <= +state.priceMax);

  if (state.sort == 'Harga terendah') products.sort((a, b) => a.price - b.price);
  if (state.sort == 'Harga tertinggi') products.sort((a, b) => b.price - a.price);

  return products;
}

// index = posisi di CATEGORIES, atau -1 untuk "Semua"
function setCategory(index) {
  state.category = index < 0 ? 'Semua' : CATEGORIES[index];
  render();
}

// Dari beranda: buka katalog pada kategori tertentu
function browseCategory(index) {
  state.query = '';
  state.category = CATEGORIES[index];
  go('katalog');
}

function browseAll() {
  state.category = 'Semua';
  state.query = '';
  go('katalog');
}

// ----- Komponen tampilan -----
// Header pembeli: logo, pencarian, menu, notifikasi
function buyerHeader() {
  const myOrderNotifications = ORDERS
    .filter((order) => order.buyer == state.user.name)
    .slice(0, 3)
    .map((order) => ({ text: `${order.no}: ${order.status}`, time: order.date, action: "go('status')" }));

  return `
    <div class="hdr" style="position:relative">
      <a onclick="go('beranda')">${logo()}</a>
      <div class="in" style="background:var(--card)">
        ${ICONS.search}
        <input id="sq" placeholder="Cari produk..." value="${escapeHtml(state.query)}"
               onkeydown="if(event.key=='Enter'){state.query=clean(this.value);go('cari')}">
      </div>
      <button class="btn o s" onclick="go('katalog')">Katalog</button>
      <button class="btn o s" onclick="go('status')">Pesanan</button>
      <button class="btn o s" onclick="go('keranjang')">Keranjang (${cartCount()})</button>
      ${notificationBell(myOrderNotifications, 'b:' + state.user.email)}
      <button class="btn o s" onclick="go('profil')">Profil</button>
    </div>`;
}

const productCard = (product) => `
  <div class="card pc" onclick="go('detail',${product.id})">
    <div class="ph" style="position:relative;overflow:hidden">${product.name[0]}${productImage(product)}</div>
    <div class="b">
      <b>${product.name}</b>
      <span class="pr">${rupiah(product.price)}</span>
      <span class="tag" style="align-self:flex-start">${product.category}</span>
      <span class="mu">${product.seller} · Stok ${product.stock}</span>
      <span class="lk" style="font-size:12px;margin-top:4px">Lihat detail</span>
    </div>
  </div>`;

const categoryBar = () => `
  <div class="cats">
    <button class="chip ${state.category == 'Semua' ? 'on' : ''}" onclick="setCategory(-1)">Semua</button>
    ${CATEGORIES.map((category, index) => `
      <button class="chip ${state.category == category ? 'on' : ''}" onclick="setCategory(${index})">${category}</button>
    `).join('')}
  </div>`;

const sortSelect = () => `
  <select class="chip" onchange="state.sort=this.value;render()">
    ${SORT_OPTIONS.map((option) => `<option ${state.sort == option ? 'selected' : ''}>${option}</option>`).join('')}
  </select>`;

const emptyProducts = '<p class="mu">Belum ada produk tersedia.</p>';
