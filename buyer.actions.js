// ============================================================================
// BUYER — aksi (menjawab klik tombol)
// ============================================================================

function applyPriceFilter() {
  state.priceMin = inputValue('mn');
  state.priceMax = inputValue('mx');
  render();
}

// ----- Halaman detail: jumlah yang akan dibeli -----
function changeDetailQty(productId, delta) {
  const product = findProduct(productId);
  const newQty = (state.detailQty || 1) + delta;

  if (newQty > product.stock) return toast('Stok hanya tersisa ' + product.stock);

  state.detailQty = Math.max(1, newQty);
  $('#dq').textContent = state.detailQty;
}

// ----- Keranjang -----
function addToCart(productId) {
  const product = findProduct(productId);
  const qty = state.detailQty || 1;
  const existing = state.cart.find((item) => item.id == productId);
  const currentQty = existing ? existing.qty : 0;

  if (!product || product.stock < 1) return toast('Stok habis');

  if (currentQty + qty > product.stock) {
    toast('Stok tidak mencukupi, jumlah dibatasi sesuai stok (' + product.stock + ')');
    if (existing) existing.qty = product.stock;
    else state.cart.push({ id: productId, qty: product.stock });
  } else if (existing) {
    existing.qty += qty;
  } else {
    state.cart.push({ id: productId, qty });
  }

  state.detailQty = 1;
  go('keranjang');
}

function changeCartQty(productId, delta) {
  const item = state.cart.find((entry) => entry.id == productId);
  const product = findProduct(productId);
  const newQty = item.qty + delta;

  if (newQty > product.stock) return toast('Stok hanya tersisa ' + product.stock);

  item.qty = Math.max(1, newQty);
  render();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((item) => item.id != productId);
  render();
}

// ----- Checkout: satu pesanan dibuat PER PENJUAL -----
function placeOrder() {
  syncCart();
  if (!state.cart.length) return toast('Keranjang kosong, checkout tidak dapat dilakukan');

  // kelompokkan isi keranjang berdasarkan penjual
  const bySeller = {};
  state.cart.forEach((item) => {
    const product = findProduct(item.id);
    (bySeller[product.seller] = bySeller[product.seller] || []).push({ item, product });
  });

  const createdOrderNumbers = [];

  Object.keys(bySeller).forEach((seller) => {
    const orderNo = 'SM-' + NEXT_ORDER_NUMBER++;
    const items = bySeller[seller].map(({ item, product }) => ({
      name: product.name,
      qty: item.qty,
      price: product.price,
    }));

    ORDERS.unshift({
      no: orderNo,
      items,
      total: items.reduce((sum, line) => sum + line.price * line.qty, 0),
      status: 'Menunggu',
      date: todayLabel(),
      buyer: state.user.name,
      payment: state.payment.startsWith('COD') ? 'COD' : state.payment,
      seller,
    });

    // kurangi stok & beri tahu penjual
    bySeller[seller].forEach(({ item, product }) => { product.stock -= item.qty; });
    NOTIFICATIONS.unshift({
      text: `Pesanan baru ${orderNo} dari ${state.user.name}`,
      time: 'Baru saja',
      seller,
      orderNo,
    });

    createdOrderNumbers.push(orderNo);
  });

  state.cart = [];
  toast(
    createdOrderNumbers.length > 1
      ? `Pesanan dikonfirmasi (${createdOrderNumbers.length} pesanan, satu per penjual)`
      : 'Pesanan dikonfirmasi'
  );
  go('status');
}
