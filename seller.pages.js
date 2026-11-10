// ============================================================================
// SELLER — halaman (tampilan)
// ============================================================================

const sellerPages = {
  // ----- Dashboard -----
  's-dash': () => {
    const products = sellerProducts();
    const orders = sellerOrders();
    const mostViewed = [...products].sort((a, b) => b.views - a.views)[0];
    const newOrderCount = orders.filter((order) => order.status == 'Menunggu').length;

    const productRows = products.slice(0, 3).map((product) => `
      <div class="row">
        ${thumbnail(product.name)}
        <div class="g">${product.name}<div class="mu">Stok ${product.stock}</div></div>
        <b>${rupiah(product.price)}</b>
      </div>`).join('');

    const orderRows = orders.slice(0, 3).map((order) => `
      <div class="row">
        <div class="g">${order.no}<div class="mu">${order.buyer}</div></div>
        ${tag(order.status)}
      </div>`).join('');

    return sellerShell('s-dash', `
      ${sellerHeader('Dashboard Penjual')}
      <div class="stats">
        ${statCard('Total Produk', products.length)}
        ${statCard('Pesanan Baru', newOrderCount)}
        ${statCard('Produk Paling Diminati', mostViewed ? mostViewed.name : '-')}
      </div>
      <div class="two">
        <div>
          <div class="h2"><h3>Produk Terbaru</h3><a onclick="go('s-produk')">Lihat Semua</a></div>
          <div class="card">${productRows || '<p class="mu">Belum terdapat produk.</p>'}</div>
        </div>
        <div>
          <div class="h2"><h3>Pesanan Terbaru</h3><a onclick="go('s-pesanan')">Lihat Semua</a></div>
          <div class="card">${orderRows || '<p class="mu">Belum ada pesanan masuk.</p>'}</div>
        </div>
      </div>`);
  },

  // ----- Kelola produk (daftar) -----
  's-produk': () => {
    const rows = sellerProducts().map((product) => {
      const statusButton = product.active
        ? `<button class="btn d s" onclick="deactivateProduct(${product.id})">Nonaktifkan</button>`
        : `<button class="btn o s" onclick="activateProduct(${product.id})">Aktifkan</button>`;

      return [
        thumbnail(product.name),
        product.name,
        rupiah(product.price),
        product.category,
        product.stock,
        tag(productStatus(product)),
        toggleSwitch(product.visible, `toggleVisibility(${product.id})`),
        `<button class="btn o s" onclick="openProductForm(${product.id})">Edit</button> ${statusButton}`,
      ];
    });

    return sellerShell('s-produk', `
      <div class="hdr">
        <h2 style="margin:0;flex:1">Kelola Produk</h2>
        <button class="btn" onclick="openProductForm()">Tambah Produk</button>
      </div>
      ${table(
        ['Foto', 'Nama Produk', 'Harga', 'Kategori', 'Stok', 'Status', 'Visibilitas', 'Aksi'],
        rows,
        'Belum terdapat produk yang dikelola. Klik “Tambah Produk” untuk memulai.'
      )}`);
  },

  // ----- Form tambah / edit produk -----
  's-form': () => {
    const editing = Boolean(state.editProductId);
    const product = editing
      ? findProduct(state.editProductId)
      : { name: '', price: '', category: CATEGORIES[0] || '', stock: '', visible: true, active: true, description: '' };

    const categoryOptions = CATEGORIES.map((category) =>
      `<option ${category == product.category ? 'selected' : ''}>${category}</option>`).join('');

    return sellerShell('s-produk', `
      <h2>${editing ? 'Edit' : 'Tambah'} Produk</h2>
      <div class="card" style="max-width:560px;display:flex;flex-direction:column;gap:12px">
        <label class="f">Foto Produk
          <div class="ph upload-preview" id="pv">Unggah foto produk${productImage(product)}</div>
          <input type="file" accept="image/*" onchange="previewUpload(this)">
        </label>
        ${formField('search', 'Nama Produk', 'Nama produk', 'text', 'fn', product.name)}
        <div class="two" style="gap:10px">
          ${formField('search', 'Harga', 'Rp 0', 'number', 'fp', product.price)}
          ${formField('search', 'Stok', '0', 'number', 'fs', product.stock)}
        </div>
        <label class="f">Kategori
          <span class="in"><select id="fc">${categoryOptions}</select></span>
        </label>
        <label class="f">Deskripsi
          <span class="in">
            <textarea id="fd" rows="3" placeholder="Deskripsi produk">${escapeHtml(product.description || '')}</textarea>
          </span>
        </label>
        <label class="f">Visibilitas
          <span class="in">
            <select id="fv">
              <option value="1" ${product.visible ? 'selected' : ''}>Tampil di katalog</option>
              <option value="0" ${product.visible ? '' : 'selected'}>Tersembunyi</option>
            </select>
          </span>
        </label>
        <div style="display:flex;gap:8px">
          <button class="btn" onclick="saveProduct()">Simpan</button>
          <button class="btn o" onclick="go('s-produk')">Batal</button>
        </div>
      </div>`);
  },

  // ----- Pesanan masuk -----
  's-pesanan': () => {
    const orders = sellerOrders();
    const selected = orders.find((order) => order.no == state.selectedOrderNo) || orders[0];

    if (!selected) {
      return sellerShell('s-pesanan', `
        ${sellerHeader('Pesanan')}
        <div class="card mu">Belum ada pesanan masuk.</div>`);
    }

    const buyer = USERS.find((user) => user.name == selected.buyer) || { phone: '-', address: '-' };

    const orderRows = orders.map((order) => [
      `<a onclick="state.selectedOrderNo='${order.no}';render()">${order.no}</a>`,
      order.items.map((item) => item.name).join(', '),
      order.buyer,
      order.items.reduce((sum, item) => sum + item.qty, 0),
      rupiah(order.total),
      tag(order.status),
      order.date,
    ]);

    const statusOptions = ORDER_STATUSES.map((status) =>
      `<option ${status == selected.status ? 'selected' : ''}>${status}</option>`).join('');

    return sellerShell('s-pesanan', `
      ${sellerHeader('Pesanan')}
      <div class="three">
        ${table(['No. Pesanan', 'Produk', 'Pembeli', 'Jumlah', 'Total', 'Status', 'Tanggal'], orderRows)}
        <div class="card">
          <b>Detail ${selected.no}</b>
          <div class="mu" style="margin-top:8px">Nama Pembeli</div>${selected.buyer}
          <div class="mu">Nomor Telepon</div>${buyer.phone}
          <div class="mu">Alamat</div>${buyer.address}
          <div class="mu">Pesanan</div>
          ${selected.items.map((item) =>
            `<div>${item.name} × ${item.qty} — ${rupiah(item.price * item.qty)}</div>`).join('')}
          <div style="margin-top:4px"><b>Total ${rupiah(selected.total)}</b></div>
          <div class="mu" style="margin:10px 0 4px">Perbarui status</div>
          <select class="sel" id="ns">${statusOptions}</select>
          <button class="btn s" style="margin-top:8px;width:100%"
                  onclick="updateOrderStatus('${selected.no}')">Perbarui Status</button>
        </div>
      </div>`);
  },

  // ----- Laporan penjualan -----
  's-laporan': () => {
    const products = sellerProducts();
    const orders = sellerOrders();
    const finished = orders.filter((order) => order.status == 'Selesai');

    const maxViews = Math.max(1, ...products.map((product) => product.views));
    const topViewed = [...products].sort((a, b) => b.views - a.views).slice(0, 5);

    const ordersPerProduct = products
      .map((product) => [product, orders.filter((order) => order.items.some((item) => item.name == product.name)).length])
      .filter(([, count]) => count)
      .sort((a, b) => b[1] - a[1]);
    const maxOrders = Math.max(1, ...ordersPerProduct.map(([, count]) => count));

    const viewBars = products.some((product) => product.views > 0)
      ? topViewed.map((product) => `
          <div class="bar">
            <span style="width:150px">${product.name}</span>
            <i style="width:${Math.max(4, Math.round((product.views / maxViews) * 220))}px"></i>
            <span class="mu">${product.views} dilihat</span>
          </div>`).join('')
      : '<p class="mu">Data popularitas belum tersedia.</p>';

    const orderBars = ordersPerProduct.map(([product, count]) => `
      <div class="bar bar--gold">
        <span style="width:150px">${product.name}</span>
        <i style="width:${Math.max(4, Math.round((count / maxOrders) * 220))}px"></i>
        <span class="mu">${count} pesanan</span>
      </div>`).join('');

    return sellerShell('s-laporan', `
      <h2>Laporan Penjualan</h2>
      <div class="stats">
        ${statCard('Pesanan Selesai', finished.length)}
        ${statCard('Pendapatan', rupiah(finished.reduce((sum, order) => sum + order.total, 0)))}
      </div>
      <div class="card">
        <b>Produk Paling Sering Dilihat</b>
        ${viewBars}
      </div>
      <div class="card" style="margin-top:12px">
        <b>Produk dengan Pesanan Terbanyak</b>
        ${orderBars || '<p class="mu">Belum ada pesanan.</p>'}
      </div>`);
  },

  // ----- Profil -----
  's-profil': () => sellerShell('s-profil', `
    <h2>Profil Penjual</h2>
    <div class="card" style="max-width:480px">${profileHeader()}${profileBody()}</div>`),
};
