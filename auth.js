// ============================================================================
// AUTH — Pilih jenis pengguna, Login, Registrasi, Logout (UC-01 – UC-03)
// Alur: welcome (Student / Dosen-Staff) → login atau daftar
// ============================================================================

// ----- Panel foto di sisi kiri -----
const authArtwork = (title, subtitle) => `
  <div class="art">
    <div style="position:relative;flex:1;display:flex;align-items:center;justify-content:center">
      ${logo(2, true)}
    </div>
    <h2>${title}</h2>
    <p>${subtitle}</p>
  </div>`;

// Lencana "Masuk sebagai Student · Ganti" di atas formulir
const memberBadge = () => `
  <div class="member-badge">
    <span class="tag">${MEMBER_TYPES[state.memberType].label}</span>
    <a onclick="resetMemberType()">Ganti</a>
  </div>`;

// ----- Halaman -----
const authPages = {
  // Langkah 1: pilih jenis pengguna
  welcome: () => `
    <div class="auth">
      ${authArtwork('Selamat datang di Shop-Mate', 'Belanja dan berjualan di lingkungan Universitas Klabat.')}
      <div class="auth-panel">
        <h2 style="margin:0;color:#3b1766">Anda adalah?</h2>
        <p class="mu" style="margin:0 0 4px;color:#5a4670">Pilih jenis pengguna sebelum melanjutkan ke login.</p>
        ${Object.entries(MEMBER_TYPES).map(([key, type]) => `
          <button type="button" class="choice" onclick="chooseMemberType('${key}')">
            <span class="choice__icon">${ICONS[key]}</span>
            <span class="choice__text">
              <b>${type.label}</b>
              <span class="mu">${type.description}</span>
              <span class="mu">Email: nama${type.domain}</span>
            </span>
          </button>`).join('')}
      </div>
    </div>`,

  // Langkah 2a: login
  login: () => {
    const type = MEMBER_TYPES[state.memberType];
    const demoAccounts = state.memberType == 'student'
      ? 'buyer@unklab.ac.id / buyer123'
      : 'seller@unklab.ac.id / seller123, admin@unklab.ac.id / admin123';

    return `
      <div class="auth">
        ${authArtwork('Selamat datang kembali', 'Satu akun untuk buyer, seller, dan administrator.')}
        <form onsubmit="return false">
          <div class="form-title"><h2 style="margin:0">Login</h2>${memberBadge()}</div>
          ${formField('mail', 'Email UNKLAB', 'nama' + type.domain, 'email', 'em')}
          ${formField('lock', 'Kata Sandi', 'Masukkan kata sandi', 'password', 'pw')}
          <div style="display:flex;justify-content:space-between">
            <label><input type="checkbox" checked> Ingat saya</label>
            <a onclick="toast('Tautan reset dikirim ke email UNKLAB')">Lupa kata sandi?</a>
          </div>
          <button class="btn" onclick="login()">Login</button>
          <div class="mu" style="text-align:center">
            Belum punya akun? <a onclick="go('daftar')">Daftar</a>
          </div>
          <div class="hint">
            Akun demo ${type.label}: ${demoAccounts}.
            Pengguna baru dapat mendaftar lewat menu Daftar.
          </div>
        </form>
      </div>`;
  },

  // Langkah 2b: daftar (termasuk memilih peran)
  daftar: () => {
    const type = MEMBER_TYPES[state.memberType];

    const roleOptions = REGISTER_ROLES.map(([value, label, description], index) => `
      <label class="pay">
        <input type="radio" name="rr" value="${value}" ${index == 0 ? 'checked' : ''}>
        <span><b>${label}</b><br><span class="mu">${description}</span></span>
      </label>`).join('');

    return `
      <div class="auth">
        ${authArtwork('Belanja dan berjualan di lingkungan Klabat', 'Untuk mahasiswa, dosen, dan staff Universitas Klabat.')}
        <form onsubmit="return false">
          <div class="form-title"><h2 style="margin:0">Daftar Akun</h2>${memberBadge()}</div>
          ${formField('user', 'Nama Lengkap', 'Nama lengkap Anda', 'text', 'rn')}
          ${formField('mail', 'Email UNKLAB', 'nama' + type.domain, 'email', 're')}
          ${formField('phone', 'Nomor Telepon', '08xx xxxx xxxx', 'tel', 'rt')}
          ${formField('home', 'Alamat', 'Alamat tempat tinggal', 'text', 'ra')}
          <div class="f">Daftar sebagai
            <div style="margin-top:4px">${roleOptions}</div>
          </div>
          ${formField('lock', 'Kata Sandi', 'Minimal 8 karakter', 'password', 'r1')}
          ${formField('lock', 'Konfirmasi Kata Sandi', 'Ulangi kata sandi', 'password', 'r2')}
          <button class="btn" onclick="register()">Daftar</button>
          <div class="mu" style="text-align:center">
            Sudah punya akun? <a onclick="go('login')">Login</a>
          </div>
        </form>
      </div>`;
  },
};

// ----- Aksi -----
const ROLE_BY_ACCOUNT_TYPE = { Buyer: 'buyer', Seller: 'seller', Administrator: 'admin' };

function chooseMemberType(type) {
  state.memberType = type;
  go('login');
}

function resetMemberType() {
  state.memberType = null;
  go('welcome');
}

function login() {
  const email = inputValue('em').trim().toLowerCase();
  const password = inputValue('pw');

  if (!isUnklabEmail(email)) return toast(EMAIL_RULE_MESSAGE);
  if (!password) return toast('Kata sandi wajib diisi');

  const user = USERS.find((candidate) => candidate.email == email);
  if (!user || user.password !== password) return toast('Email atau kata sandi salah');
  if (!user.active) return toast('Akun dinonaktifkan');
  if (user.memberType != state.memberType) {
    return toast(`Akun ini terdaftar sebagai ${MEMBER_TYPES[user.memberType].label}. Pilih jenis pengguna yang sesuai.`);
  }

  state.user = user;
  state.role = ROLE_BY_ACCOUNT_TYPE[user.role];
  state.editingProfile = false;
  state.history = [];                 // BARU: riwayat tombol Kembali dikosongkan
  go(ROLE_HOME[state.role]);
}

function register() {
  const name = clean(inputValue('rn'));
  const address = clean(inputValue('ra'));
  const phone = clean(inputValue('rt'));
  const email = inputValue('re').trim().toLowerCase();
  const password = inputValue('r1');
  const passwordConfirm = inputValue('r2');
  const role = (document.querySelector('input[name=rr]:checked') || {}).value || 'Buyer';
  const type = MEMBER_TYPES[state.memberType];

  if (!name || !address || !phone || !email) return toast('Lengkapi semua data');
  if (!isUnklabEmail(email)) return toast(EMAIL_RULE_MESSAGE);
  if (!email.endsWith(type.domain)) {
    return toast(`${type.label} harus memakai email berakhiran ${type.domain}`);
  }
  if (!isValidPhone(phone)) return toast(PHONE_RULE_MESSAGE);
  if (password.length < 8 || password != passwordConfirm) {
    return toast('Kata sandi minimal 8 karakter dan harus sama');
  }
  if (emailAlreadyUsed(email)) return toast('Email sudah terdaftar, gunakan email lain');
  if (USERS.some((user) => user.name == name)) {
    return toast('Nama sudah dipakai pengguna lain, tambahkan nama belakang');
  }

  USERS.push({ name, email, password, phone, address, role, memberType: state.memberType, active: true });
  toast('Akun berhasil dibuat, silakan login');
  go('login');
}

function logout() {
  state.role = null;
  state.user = null;
  state.memberType = null;
  state.cart = [];
  state.editingProfile = false;
  state.history = [];                 // BARU: riwayat tombol Kembali dikosongkan
  go('welcome');
}