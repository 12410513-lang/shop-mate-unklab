// ============================================================================
// SELLER — aksi (menjawab klik tombol)
// ============================================================================

// Buka form: tanpa argumen = tambah produk baru, dengan id = edit produk
function openProductForm(productId = null) {
  state.editProductId = productId;
  state.uploadedImage = null;
  go('s-form');
}

// Pratinjau foto yang dipilih
function previewUpload(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    state.uploadedImage = reader.result;
    $('#pv').innerHTML =
      `<img src="${reader.result}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`;
  };
  reader.readAsDataURL(file);
}

function saveProduct() {
  const name = clean(inputValue('fn'));
  const description = clean(inputValue('fd'));
  const price = +inputValue('fp');
  const stock = +inputValue('fs');
  const category = inputValue('fc');

  if (!name || inputValue('fp') === '' || inputValue('fs') === '') {
    return toast('Nama, harga, dan stok wajib diisi');
  }
  if (!category) return toast('Pilih kategori produk');
  if (!(price > 0)) return toast('Harga harus lebih dari 0');
  if (!Number.isInteger(stock) || stock < 0) return toast('Stok harus bilangan bulat, minimal 0');

  const fields = { name, price, stock, description, category, visible: inputValue('fv') === '1' };
  if (state.uploadedImage) {
    fields.image = state.uploadedImage;
    state.uploadedImage = null;
  }

  if (state.editProductId) {
    Object.assign(findProduct(state.editProductId), fields);
  } else {
    PRODUCTS.unshift({
      id: Date.now(),
      seller: state.user.name,
      views: 0,
      image: '',
      active: true,
      ...fields,
    });
  }

  toast('Produk disimpan');
  go('s-produk');
}

// UC-19: visibilitas produk di katalog
function toggleVisibility(productId) {
  const product = findProduct(productId);
  product.visible = !product.visible;
  toast(product.visible ? 'Produk ditampilkan di katalog' : 'Produk disembunyikan dari katalog');
  render();
}

// UC-14: nonaktifkan produk (dengan konfirmasi)
function deactivateProduct(productId) {
  if (!confirm('Nonaktifkan produk ini? Produk tidak akan tersedia untuk pesanan baru.')) return;
  findProduct(productId).active = false;
  toast('Produk dinonaktifkan');
  render();
}

function activateProduct(productId) {
  findProduct(productId).active = true;
  toast('Produk diaktifkan');
  render();
}

// UC-16: status pesanan hanya boleh maju
function updateOrderStatus(orderNo) {
  const order = ORDERS.find((entry) => entry.no == orderNo);
  const newStatus = inputValue('ns');

  if (!order || order.seller != state.user.name) return toast('Pesanan tidak ditemukan');
  if (ORDER_STATUSES.indexOf(newStatus) < ORDER_STATUSES.indexOf(order.status)) {
    return toast('Status tidak valid: status tidak boleh mundur dari "' + order.status + '"');
  }
  if (newStatus == order.status) return toast('Status tidak berubah');

  order.status = newStatus;
  NOTIFICATIONS.unshift({
    text: `${orderNo} berubah ke ${newStatus}`,
    time: 'Baru saja',
    seller: order.seller,
    orderNo,
  });
  toast('Status diperbarui');
  render();
}
