// ============================================================================
// ADMIN — aksi (menjawab klik tombol)
// ============================================================================

// ----- Pengguna (UC-21 – UC-24) -----

// Tanpa argumen = tambah pengguna baru, dengan index = edit
function openUserForm(index = null) {
  state.editUserIndex = index;
  go('a-uform');
}

function saveUser() {
  const index = state.editUserIndex;
  const password = inputValue('up');
  const data = {
    name: clean(inputValue('un')),
    email: inputValue('ue').trim().toLowerCase(),
    phone: clean(inputValue('ut')),
    address: clean(inputValue('ua')),
    role: inputValue('ur'),
    memberType: inputValue('um'),
    active: inputValue('us') === '1',
  };

  if (!data.name || !data.address) return toast('Nama dan alamat wajib diisi');
  if (!isUnklabEmail(data.email)) return toast(EMAIL_RULE_MESSAGE);
  if (!isValidPhone(data.phone)) return toast(PHONE_RULE_MESSAGE);
  if (emailAlreadyUsed(data.email, index)) return toast('Email sudah digunakan, gunakan email lain');
  if (USERS.some((user, i) => i !== index && user.name == data.name)) {
    return toast('Nama sudah dipakai pengguna lain');
  }
  // pengguna baru wajib punya kata sandi; saat edit, kosong = tidak diubah
  if ((index == null || password) && password.length < 8) return toast('Kata sandi minimal 8 karakter');

  if (index != null) {
    const user = USERS[index];
    if (user === state.user && (data.role != user.role || !data.active)) {
      return toast('Peran dan status akun yang sedang digunakan tidak dapat diubah');
    }
    renameReferences(user.name, data.name);
    Object.assign(user, data);
    if (password) user.password = password;
  } else {
    USERS.push({ ...data, password });
  }

  toast('Pengguna disimpan');
  go('a-user');
}

function toggleUserActive(index) {
  const user = USERS[index];
  if (user === state.user) return toast('Akun yang sedang digunakan tidak dapat dinonaktifkan');
  user.active = !user.active;
  render();
}

function deleteUser(index) {
  const user = USERS[index];

  if (!confirm('Hapus pengguna ini?')) return;
  if (user === state.user) return toast('Akun yang sedang digunakan tidak dapat dihapus');
  if (userHasData(user)) {
    return toast('Penghapusan dicegah: akun masih memiliki data/transaksi. Gunakan Nonaktifkan.');
  }

  USERS.splice(index, 1);
  toast('Pengguna dihapus');
  render();
}

// ----- Produk (UC-25) -----
function adminEditPrice(productId) {
  const product = findProduct(productId);
  const input = prompt('Harga baru', product.price);

  if (input === null) return;
  if (!(+input > 0)) return toast('Harga tidak valid');

  product.price = +input;
  toast('Harga diperbarui');
  render();
}

function adminToggleProduct(productId) {
  const product = findProduct(productId);
  if (product.active && !confirm('Nonaktifkan produk ini?')) return;
  product.active = !product.active;
  render();
}

function adminDeleteProduct(productId) {
  if (!confirm('Hapus produk?')) return;
  PRODUCTS = PRODUCTS.filter((product) => product.id != productId);
  toast('Produk dihapus');
  render();
}

// ----- Kategori (UC-26) -----
function addCategory() {
  const name = clean(inputValue('nk'));

  if (!name) return toast('Nama kategori wajib diisi');
  if (CATEGORIES.some((category) => category.toLowerCase() == name.toLowerCase())) {
    return toast('Kategori sudah ada');
  }

  CATEGORIES.push(name);
  toast('Kategori ditambahkan');
  render();
}

function editCategory(index) {
  const input = prompt('Nama kategori', CATEGORIES[index]);
  if (input === null) return;

  const name = clean(input);
  if (!name) return toast('Nama kategori wajib diisi');
  if (CATEGORIES.some((category, i) => i !== index && category.toLowerCase() == name.toLowerCase())) {
    return toast('Kategori sudah ada');
  }

  // produk yang memakai kategori lama ikut diperbarui
  PRODUCTS.forEach((product) => {
    if (product.category == CATEGORIES[index]) product.category = name;
  });
  CATEGORIES[index] = name;
  toast('Kategori diperbarui');
  render();
}

function deleteCategory(index) {
  if (!confirm('Hapus kategori?')) return;
  if (isCategoryUsed(CATEGORIES[index])) {
    return toast('Penghapusan dicegah: kategori masih digunakan oleh produk');
  }

  CATEGORIES.splice(index, 1);
  toast('Kategori dihapus');
  render();
}
