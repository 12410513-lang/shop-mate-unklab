// ============================================================================
// PROFIL — dipakai bersama oleh Pembeli, Penjual (s-profil), Administrator (a-profil)
// ============================================================================

const profileHeader = () => `
  <div class="sw" style="gap:14px;margin-bottom:12px">
    <div class="av">${(state.user.name || '?')[0]}</div>
    <div>
      <b style="font-size:18px">${state.user.name}</b><br>
      <span class="tag">${state.user.role}</span>
    </div>
  </div>`;

function profileBody() {
  const user = state.user;

  if (state.editingProfile) {
    return `
      ${formField('user', 'Nama', '', 'text', 'pn', user.name)}
      ${formField('phone', 'Nomor Telepon', '', 'tel', 'pt', user.phone)}
      ${formField('home', 'Alamat', '', 'text', 'pa', user.address)}
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn" onclick="saveProfile()">Simpan</button>
        <button class="btn o" onclick="state.editingProfile=false;render()">Batal</button>
      </div>`;
  }

  const details = [
    ['Email', user.email],
    ['Nomor Telepon', user.phone],
    ['Alamat', user.address],
  ];

  return `
    ${details.map(([label, value]) => `
      <div class="row">
        <span class="mu" style="width:110px">${label}</span>
        <div class="g">${value}</div>
      </div>`).join('')}
    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="btn" onclick="state.editingProfile=true;render()">Edit Profil</button>
      <button class="btn d" onclick="logout()">Logout</button>
    </div>`;
}

function saveProfile() {
  const name = clean(inputValue('pn'));
  const phone = clean(inputValue('pt'));
  const address = clean(inputValue('pa'));

  if (!name || !address) return toast('Nama dan alamat wajib diisi');
  if (!isValidPhone(phone)) return toast(PHONE_RULE_MESSAGE);
  if (USERS.some((user) => user !== state.user && user.name == name)) {
    return toast('Nama sudah dipakai pengguna lain');
  }

  renameReferences(state.user.name, name);
  Object.assign(state.user, { name, phone, address });
  state.editingProfile = false;
  toast('Profil disimpan');
  render();
}
