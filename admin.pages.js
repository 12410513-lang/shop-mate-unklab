// ============================================================================
// ADMIN — halaman (tampilan)
// ============================================================================

const adminPages = {
  // ----- Dashboard -----
  'a-dash': () => {
    const latestRows = ORDERS.slice(0, 3).map((order) => [
      `<a onclick="${openTransaction(order.no)}">${trxNumber(order)}</a>`,
      order.buyer,
      rupiah(order.total),
      tag(order.status),
    ]);

    return adminShell('a-dash', `
      <h2>Dashboard Administrator</h2>
      <div class="stats">
        ${statCard('Total Pengguna', USERS.length)}
        ${statCard('Total Produk', PRODUCTS.length)}
        ${statCard('Total Kategori', CATEGORIES.length)}
        ${statCard('Total Transaksi', ORDERS.length)}
      </div>
      <div class="h2"><h3>Transaksi Terbaru</h3><a onclick="go('a-trx')">Lihat Semua</a></div>
      ${table(['No. Transaksi', 'Pembeli', 'Total', 'Status'], latestRows, 'Belum terdapat transaksi.')}`);
  },

  // ----- Kelola pengguna -----
  'a-user': () => {
    const rows = USERS.map((user, index) => [
      user.name,
      user.email,
      `<span class="tag">${user.role}</span>`,
      tag(user.active ? 'Aktif' : 'Nonaktif'),
      actionButtons(
        `<button class="btn o s" onclick="openUserForm(${index})">Edit</button>`,
        `<button class="btn o s" onclick="toggleUserActive(${index})">${user.active ? 'Nonaktifkan' : 'Aktifkan'}</button>`,
        `<button class="btn d s" onclick="deleteUser(${index})">Hapus</button>`
      ),
    ]);

    return adminShell('a-user', `
      <div class="hdr">
        <h2 style="margin:0;flex:1">Kelola Pengguna</h2>
        <button class="btn" onclick="openUserForm()">Tambah Pengguna</button>
      </div>
      ${table(['Nama', 'Email', 'Role', 'Status', 'Aksi'], rows, 'Belum terdapat pengguna.')}`);
  },

  // ----- Form tambah / edit pengguna -----
  'a-uform': () => {
    const editing = state.editUserIndex != null;
    const user = editing
      ? USERS[state.editUserIndex]
      : { name: '', email: '', phone: '', address: '', role: 'Buyer', memberType: 'student', active: true };

    const roleOptions = USER_ROLES.map((role) =>
      `<option ${role == user.role ? 'selected' : ''}>${role}</option>`).join('');

    return adminShell('a-user', `
      <h2>${editing ? 'Edit' : 'Tambah'} Pengguna</h2>
      <div class="card" style="max-width:520px;display:flex;flex-direction:column;gap:12px">
        ${formField('user', 'Nama', 'Nama lengkap', 'text', 'un', user.name)}
        ${formField('mail', 'Email', 'nama@unklab.ac.id', 'email', 'ue', user.email)}
        ${formField('phone', 'Nomor Telepon', '08xx', 'tel', 'ut', user.phone)}
        ${formField('home', 'Alamat', 'Alamat', 'text', 'ua', user.address)}
        ${formField('lock', 'Kata Sandi',
          editing ? 'Kosongkan jika tidak diubah' : 'Minimal 8 karakter', 'password', 'up')}
        <label class="f">Jenis Pengguna
          <span class="in">
            <select id="um">
              ${Object.entries(MEMBER_TYPES).map(([key, type]) =>
                `<option value="${key}" ${key == user.memberType ? 'selected' : ''}>${type.label}</option>`).join('')}
            </select>
          </span>
        </label>
        <div class="two" style="gap:10px">
          <label class="f">Role
            <span class="in"><select id="ur">${roleOptions}</select></span>
          </label>
          <label class="f">Status
            <span class="in">
              <select id="us">
                <option value="1" ${user.active ? 'selected' : ''}>Aktif</option>
                <option value="0" ${user.active ? '' : 'selected'}>Nonaktif</option>
              </select>
            </span>
          </label>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn" onclick="saveUser()">Simpan</button>
          <button class="btn o" onclick="go('a-user')">Batal</button>
        </div>
      </div>`);
  },

  // ----- Kelola produk -----
  'a-produk': () => {
    const rows = PRODUCTS.map((product) => [
      thumbnail(product.name),
      product.name,
      product.seller,
      product.category,
      rupiah(product.price),
      product.stock,
      tag(productStatus(product)),
      actionButtons(
        `<button class="btn o s" onclick="adminEditPrice(${product.id})">Edit</button>`,
        `<button class="btn o s" onclick="adminToggleProduct(${product.id})">${product.active ? 'Nonaktifkan' : 'Aktifkan'}</button>`,
        `<button class="btn d s" onclick="adminDeleteProduct(${product.id})">Hapus</button>`
      ),
    ]);

    return adminShell('a-produk', `
      <h2>Kelola Produk</h2>
      ${table(['Foto', 'Nama Produk', 'Seller', 'Kategori', 'Harga', 'Stok', 'Status', 'Aksi'], rows, 'Belum terdapat produk.')}`);
  },

  // ----- Kelola kategori -----
  'a-kat': () => {
    const rows = CATEGORIES.map((category, index) => [
      category,
      PRODUCTS.filter((product) => product.category == category).length,
      actionButtons(
        `<button class="btn o s" onclick="editCategory(${index})">Edit</button>`,
        `<button class="btn d s" onclick="deleteCategory(${index})">Hapus</button>`
      ),
    ]);

    return adminShell('a-kat', `
      <div class="hdr">
        <h2 style="margin:0;flex:1">Kelola Kategori</h2>
        <div class="in" style="background:var(--card)">
          <input id="nk" placeholder="Nama kategori baru">
        </div>
        <button class="btn" onclick="addCategory()">Tambah Kategori</button>
      </div>
      ${table(['Kategori', 'Jumlah Produk', 'Aksi'], rows, 'Belum terdapat kategori.')}`);
  },

  // ----- Daftar transaksi -----
  'a-trx': () => {
    const rows = ORDERS.map((order) => [
      `<a onclick="${openTransaction(order.no)}">${trxNumber(order)}</a>`,
      order.buyer,
      order.seller,
      orderItemsText(order),
      rupiah(order.total),
      order.payment,
      tag(order.status),
      order.date,
    ]);

    return adminShell('a-trx', `
      <h2>Transaksi</h2>
      ${table(['No. Transaksi', 'Pembeli', 'Seller', 'Produk', 'Total', 'Metode', 'Status', 'Tanggal'], rows, 'Belum terdapat transaksi.')}`);
  },

  // ----- Detail transaksi -----
  'a-trxd': () => {
    const order = ORDERS.find((entry) => entry.no == state.selectedTrxOrderNo);

    if (!order) {
      return adminShell('a-trx', `
        <h2>Detail Transaksi</h2>
        <div class="card">Transaksi tidak ditemukan.
          <a onclick="go('a-trx')">Kembali ke daftar transaksi</a></div>`);
    }

    const buyer = USERS.find((user) => user.name == order.buyer) || { email: '-', phone: '-', address: '-' };

    const itemRows = order.items.map((item) => `
      <div class="row">
        <div class="g">${item.name}<div class="mu">${item.qty} × ${rupiah(item.price)}</div></div>
        <b>${rupiah(item.price * item.qty)}</b>
      </div>`).join('');

    return adminShell('a-trx', `
      <div class="hdr">
        <h2 style="margin:0;flex:1">Detail ${trxNumber(order)}</h2>
        <button class="btn o" onclick="go('a-trx')">Kembali</button>
      </div>
      <div class="two">
        <div class="card">
          <b>Informasi Transaksi</b>
          <div class="mu" style="margin-top:8px">No. Pesanan</div>${order.no}
          <div class="mu">Tanggal</div>${order.date}
          <div class="mu">Metode Pembayaran</div>${order.payment}
          <div class="mu">Status</div>${tag(order.status)}
          <div class="mu" style="margin-top:8px">Seller</div>${order.seller}
          <div class="mu">Pembeli</div>${order.buyer}
          <div class="mu">Email</div>${buyer.email}
          <div class="mu">Nomor Telepon</div>${buyer.phone}
          <div class="mu">Alamat</div>${buyer.address}
        </div>
        <div class="card">
          <b>Rincian Produk</b>
          ${itemRows}
          <div class="row">
            <div class="g"><b>Total</b></div>
            <b class="pr">${rupiah(order.total)}</b>
          </div>
        </div>
      </div>`);
  },

  // ----- Profil -----
  'a-profil': () => adminShell('a-profil', `
    <h2>Profil</h2>
    <div class="card" style="max-width:480px">${profileHeader()}${profileBody()}</div>`),
};
