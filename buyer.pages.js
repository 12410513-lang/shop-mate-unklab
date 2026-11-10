// ============================================================================
// BUYER — halaman (tampilan)
// ============================================================================

const buyerPages = {
  // ----- Beranda -----
  beranda: () => `
    ${buyerHeader()}
    <div class="hero">
      <svg viewBox="0 0 300 200" fill="none" stroke="#fff" stroke-width="1.5">
        <path d="M20 190V90h90v100M110 190V60h110v130M220 190V100h70v90M165 60V30l30 0v30"/>
      </svg>
      <h1>Belanja di Kampus <span>Klabat</span></h1>
      <p>Temukan produk dari sesama mahasiswa, dosen, dan staff UNKLAB.</p>
    </div>
    <div class="cats">
      ${CATEGORIES.map((category, index) =>
        `<button class="chip" onclick="browseCategory(${index})">${category}</button>`).join('')}
    </div>
    <div class="h2">
      <h3>Produk Terbaru</h3>
      <a onclick="browseAll()">Lihat Semua</a>
    </div>
    <div class="grid">
      ${PRODUCTS.filter(isVisibleProduct).slice(0, 4).map(productCard).join('') || emptyProducts}
    </div>`,

  // ----- Katalog -----
  katalog: () => `
    ${buyerHeader()}
    <h2 style="margin:0 0 12px">Katalog Produk</h2>
    <div class="hdr">
      <div class="in" style="background:var(--card)">
        ${ICONS.search}
        <input placeholder="Cari di katalog..." value="${escapeHtml(state.query)}"
               onkeydown="if(event.key=='Enter'){state.query=clean(this.value);render()}">
      </div>
      ${sortSelect()}
    </div>
    ${categoryBar()}
    <div class="grid">
      ${filteredProducts().map(productCard).join('') || emptyProducts}
    </div>`,

  // ----- Hasil pencarian -----
  cari: () => {
    const results = filteredProducts();
    const categoryOptions = ['Semua', ...CATEGORIES].map((category, index) => `
      <div>
        <label>
          <input type="radio" name="k" ${state.category == category ? 'checked' : ''}
                 onchange="setCategory(${index - 1})"> ${category}
        </label>
      </div>`).join('');

    return `
      ${buyerHeader()}
      <p>Hasil pencarian untuk <b>“${escapeHtml(state.query)}”</b> · <b>${results.length} hasil</b></p>
      <div class="three" style="grid-template-columns:200px 1fr;align-items:start">
        <div class="card">
          <b>Kategori</b>
          ${categoryOptions}
          <hr style="border:0;border-top:1px solid var(--line)">
          <b>Harga</b>
          <div class="in" style="margin:6px 0">
            <input id="mn" placeholder="Min" size="6" value="${escapeHtml(state.priceMin)}">
          </div>
          <div class="in">
            <input id="mx" placeholder="Maks" size="6" value="${escapeHtml(state.priceMax)}">
          </div>
          <button class="btn s" style="margin-top:8px;width:100%" onclick="applyPriceFilter()">Terapkan</button>
        </div>
        <div class="grid">
          ${results.map(productCard).join('') || '<p class="mu">Produk tidak ditemukan.</p>'}
        </div>
      </div>`;
  },

  // ----- Detail produk -----
  detail: () => {
    const product = findProduct(state.productId);

    if (!product || !isVisibleProduct(product)) {
      return `
        ${buyerHeader()}
        <div class="card">Produk tidak tersedia. <a onclick="go('katalog')">Kembali ke katalog</a></div>`;
    }

    const outOfStock = product.stock < 1;
    const description =
      product.description ||
      `${product.name} dari ${product.seller}, siap diambil di area kampus UNKLAB.`;

    const quantityPicker = outOfStock ? '' : `
      <div class="sw">Jumlah
        <span class="qty">
          <button onclick="changeDetailQty(${product.id},-1)">−</button>
          <span id="dq">1</span>
          <button onclick="changeDetailQty(${product.id},1)">+</button>
        </span>
      </div>`;

    const addButton = outOfStock
      ? '<button class="btn" disabled style="opacity:.5;cursor:not-allowed">Stok Habis</button>'
      : `<button class="btn" onclick="addToCart(${product.id})">Tambah ke Keranjang</button>`;

    return `
      ${buyerHeader()}
      <div class="two">
        <div class="ph card" style="height:380px;font-size:96px;position:relative;overflow:hidden">
          ${product.name[0]}${productImage(product)}
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <h2 style="margin:0">${product.name}</h2>
          <div class="pr" style="font-size:24px">${rupiah(product.price)}</div>
          <div>
            <span class="tag">${product.category}</span>
            <span class="tag ${outOfStock ? 'er' : 'ok'}">Stok ${product.stock}</span>
          </div>
          <div class="mu">Penjual: ${product.seller}</div>
          <b>Deskripsi</b>
          <p style="margin:0;color:var(--muted)">${description}</p>
          ${quantityPicker}
          ${addButton}
        </div>
      </div>`;
  },

  // ----- Keranjang -----
  keranjang: () => {
    syncCart();

    if (!state.cart.length) {
      return `
        ${buyerHeader()}
        <h2 style="margin:0 0 12px">Keranjang Belanja</h2>
        <div class="card">Keranjang masih kosong. <a onclick="go('katalog')">Lihat katalog</a></div>`;
    }

    const cartRows = state.cart.map((item) => {
      const product = findProduct(item.id);
      return `
        <div class="row">
          ${thumbnail(product.name, 56)}
          <div class="g"><b>${product.name}</b><div class="mu">${rupiah(product.price)}</div></div>
          <span class="qty">
            <button onclick="changeCartQty(${item.id},-1)">−</button>
            <span>${item.qty}</span>
            <button onclick="changeCartQty(${item.id},1)">+</button>
          </span>
          <b style="min-width:100px;text-align:right">${rupiah(product.price * item.qty)}</b>
          <button class="btn d s" onclick="removeFromCart(${item.id})">Hapus</button>
        </div>`;
    }).join('');

    return `
      ${buyerHeader()}
      <h2 style="margin:0 0 12px">Keranjang Belanja</h2>
      <div class="three">
        <div class="card">${cartRows}</div>
        <div class="card">
          <b>Total</b>
          <div class="pr" style="font-size:24px;margin:6px 0 14px">${rupiah(cartTotal())}</div>
          <button class="btn" style="width:100%" onclick="go('checkout')">Lanjut ke Checkout</button>
        </div>
      </div>`;
  },

  // ----- Checkout -----
  checkout: () => {
    syncCart();

    if (!state.cart.length) {
      return `
        ${buyerHeader()}
        <h2 style="margin:0 0 12px">Checkout</h2>
        <div class="card">Keranjang kosong, checkout tidak dapat dilakukan.
          <a onclick="go('katalog')">Lihat katalog</a></div>`;
    }

    const sellerCount = new Set(state.cart.map((item) => findProduct(item.id).seller)).size;
    const user = state.user;

    const summaryRows = state.cart.map((item) => {
      const product = findProduct(item.id);
      return `
        <div class="row">
          <div class="g">${product.name}<div class="mu">${item.qty} × ${rupiah(product.price)}</div></div>
          <b>${rupiah(product.price * item.qty)}</b>
        </div>`;
    }).join('');

    const paymentOptions = PAYMENT_METHODS.map((method) => `
      <label class="pay">
        <input type="radio" name="pm" ${state.payment == method ? 'checked' : ''}
               onchange="state.payment='${method}'"> ${method}
      </label>`).join('');

    const splitNotice = sellerCount > 1
      ? `<div class="hint" style="margin:8px 0">Produk dari ${sellerCount} penjual akan dibuat menjadi ${sellerCount} pesanan terpisah.</div>`
      : '';

    return `
      ${buyerHeader()}
      <h2 style="margin:0 0 12px">Checkout</h2>
      <div class="two">
        <div>
          <div class="card" style="margin-bottom:14px">
            <b>Informasi Pembeli</b>
            <div class="mu">Nama</div>${user.name}
            <div class="mu">Email</div>${user.email}
            <div class="mu">Nomor Telepon</div>${user.phone}
            <div class="mu">Alamat</div>${user.address}
          </div>
          <div class="card">
            <b>Metode Pembayaran</b>
            <div style="margin-top:8px">${paymentOptions}</div>
          </div>
        </div>
        <div class="card">
          <b>Ringkasan Pesanan</b>
          ${summaryRows}
          <div class="row">
            <div class="g"><b>Total</b></div>
            <b class="pr">${rupiah(cartTotal())}</b>
          </div>
          ${splitNotice}
          <button class="btn" style="width:100%" onclick="placeOrder()">Konfirmasi Pesanan</button>
        </div>
      </div>`;
  },

  // ----- Status pesanan -----
  status: () => {
    const myOrders = ORDERS.filter((order) => order.buyer == state.user.name);
    const activeOrders = myOrders.filter((order) => order.status != 'Selesai');
    const finishedOrders = myOrders.filter((order) => order.status == 'Selesai');

    const activeCards = activeOrders.map((order) => `
      <div class="two" style="margin-bottom:14px">
        <div class="card">
          <div class="row">
            <div class="g"><b>${order.no}</b><div class="mu">${order.date}</div></div>
            ${tag(order.status)}
          </div>
          <div class="row">
            <div class="g">${orderItemsText(order)}</div>
            <b>${rupiah(order.total)}</b>
          </div>
          <div class="mu">Pembayaran: ${order.payment}</div>
        </div>
        <div class="card">
          <b>Timeline</b>
          <ul class="tl">
            ${ORDER_STATUSES.map((status, index) => `
              <li class="${index <= ORDER_STATUSES.indexOf(order.status) ? 'd' : ''}">
                <div><b>${status}</b></div>
              </li>`).join('')}
          </ul>
        </div>
      </div>`).join('');

    const noActiveText = myOrders.length ? 'Tidak ada pesanan aktif.' : 'Belum ada pesanan.';

    const historyRows = finishedOrders.map((order) => `
      <div class="row">
        <div class="g"><b>${order.no}</b><div class="mu">${orderItemsText(order)} · ${order.date}</div></div>
        <b>${rupiah(order.total)}</b>
        ${tag(order.status)}
      </div>`).join('');

    return `
      ${buyerHeader()}
      <h2 style="margin:0 0 12px">Status Pesanan</h2>
      <h3>Pesanan Aktif</h3>
      ${activeCards || `<p class="mu">${noActiveText}</p>`}
      <h3>Riwayat Pesanan</h3>
      <div class="card">${historyRows || '<p class="mu">Belum ada riwayat.</p>'}</div>`;
  },

  // ----- Profil -----
  profil: () => `
    ${buyerHeader()}
    <div class="card" style="max-width:520px;margin:auto">
      ${profileHeader()}${profileBody()}
    </div>`,
};
