// ============================================================================
// LOGO SHOP-MATE UNKLAB
// Warna diatur lewat kelas CSS (lihat css/components.css), bukan di sini.
//   logo()            → untuk latar terang
//   logo(2, true)     → ukuran 2×, untuk latar gelap (sidebar, panel ungu)
// ============================================================================

function logo(scale = 1.5, onDark = false) {
  const gap = 8 * scale;
  const width = 40 * scale;
  const height = 36 * scale;

  return `
    <span class="logo ${onDark ? 'logo--dark' : ''}" style="gap:${gap}px">
      <svg width="${width}" height="${height}" viewBox="0 0 40 36" fill="none">
        <path class="logo__cart" d="M2 6h6l4 17h18l4-12H10"
              stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <circle class="logo__dot" cx="15" cy="30" r="2.6"/>
        <circle class="logo__dot" cx="28" cy="30" r="2.6"/>
        <path class="logo__cap" d="M21 1 31 5.5 21 10 11 5.5z"/>
        <path class="logo__cap-line" d="M15.5 8v4c3 2 8 2 11 0V8" stroke-width="2"/>
        <path class="logo__tassel" d="M31 6v5" stroke-width="1.6"/>
      </svg>
      <span style="line-height:1.1">
        <b style="font-size:${18 * scale}px;display:block">Shop-Mate</b>
        <small class="logo__sub" style="font-size:${10 * scale}px;letter-spacing:.14em;font-weight:600">UNKLAB</small>
      </span>
    </span>`;
}
