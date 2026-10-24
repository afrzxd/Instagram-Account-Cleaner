const $ = (id) => document.getElementById(id);
const state = { followers: new Set(), following: new Set(), candidates: [], selected: new Set(), targets: [], queue: [], queueIndex: 0, running: false, waiting: false, countdownTimer: null, countdownEnds: 0, currentUsername: null };
const EXCLUDED_PATHS = new Set(['accounts','explore','direct','p','reel','reels','stories','about','developer','legal','privacy','terms','challenge','emails','web','tv']);


function parseUsernameList(text) {
  const out = new Set();
  for (const raw of text.split(/\r?\n/)) {
    const user = raw.trim().replace(/^@/, '').toLowerCase();
    if (/^[a-z0-9._]{1,30}$/.test(user) && !EXCLUDED_PATHS.has(user)) out.add(user);
  }
  return [...out];
}
async function initializeTargets() {
  try {
    const saved = await chrome.storage.local.get(['targetUsers']);
    if (Array.isArray(saved.targetUsers) && saved.targetUsers.length) {
      state.targets = parseUsernameList(saved.targetUsers.join('\n'));
      $('targetStatus').textContent = `${state.targets.length.toLocaleString('id-ID')} target aktif tersimpan.`;
    } else {
      const response = await fetch(chrome.runtime.getURL('targets.txt'));
      if (!response.ok) throw new Error('File target bawaan tidak dapat dibaca.');
      state.targets = parseUsernameList(await response.text());
      await chrome.storage.local.set({ targetUsers: state.targets });
      $('targetStatus').textContent = state.targets.length ? `${state.targets.length.toLocaleString('id-ID')} target dimuat dari file bawaan.` : 'Daftar target kosong. Impor file TXT untuk memulai.';
    }
    $('loadTargetBtn').disabled = false;
  } catch (err) {
    $('targetStatus').textContent = err?.message || 'Gagal memuat daftar target.';
    $('loadTargetBtn').disabled = false;
  }
}
$('targetFile').addEventListener('change', () => {
  $('loadTargetBtn').disabled = !$('targetFile').files.length;
});
$('loadTargetBtn').addEventListener('click', async () => {
  const file = $('targetFile').files[0];
  if (!file) { $('targetStatus').textContent = 'Pilih file TXT terlebih dahulu.'; return; }
  try {
    const users = parseUsernameList(await file.text());
    if (!users.length) throw new Error('Tidak menemukan username valid di file TXT.');
    state.targets = users;
    await chrome.storage.local.set({ targetUsers: users });
    $('targetStatus').textContent = `Daftar diganti: ${users.length.toLocaleString('id-ID')} target. Muat ulang tab Instagram agar panel memakai daftar baru.`;
  } catch (err) { $('targetStatus').textContent = err?.message || 'Gagal membaca file TXT.'; }
});

function normalizeProfileHref(href) {
  try {
    const url = new URL(href, 'https://www.instagram.com');
    const host = url.hostname.toLowerCase();
    if (!['instagram.com', 'www.instagram.com', 'm.instagram.com'].includes(host)) return null;
    const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    if (parts[0] === '_u') parts.shift();
    if (parts.length !== 1) return null;
    const username = parts[0];
    if (!/^[a-zA-Z0-9._]{1,30}$/.test(username) || EXCLUDED_PATHS.has(username.toLowerCase())) return null;
    return username.toLowerCase();
  } catch { return null; }
}

async function parseFiles(fileList) {
  const names = [...fileList];
  if (!names.length) return new Set();
  const users = new Set();
  for (const file of names) {
    if (file.size > 30 * 1024 * 1024) throw new Error(`${file.name} lebih dari 30 MB.`);
    const text = await file.text();
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const links = doc.querySelectorAll('a[href]');
    let found = 0;
    for (const link of links) {
      const username = normalizeProfileHref(link.getAttribute('href') || '');
      if (username) { users.add(username); found++; }
    }
    if (found === 0) throw new Error(`Tidak menemukan link profil Instagram di ${file.name}. Pastikan file HTML ekspor yang benar.`);
  }
  return users;
}

function setFileStatus() {
  const f = $('followersFiles').files;
  const g = $('followingFiles').files;
  const followerLabel = f.length ? `${f.length} file followers` : 'followers belum dipilih';
  const followingLabel = g.length ? `${g.length} file following` : 'following belum dipilih';
  $('fileStatus').textContent = `${followerLabel} · ${followingLabel}`;
  $('compareBtn').disabled = !f.length || !g.length;
}
$('followersFiles').addEventListener('change', setFileStatus);
$('followingFiles').addEventListener('change', setFileStatus);

$('compareBtn').addEventListener('click', async () => {
  const btn = $('compareBtn');
  btn.disabled = true; btn.textContent = 'Memproses…';
  try {
    const [followers, following] = await Promise.all([
      parseFiles($('followersFiles').files), parseFiles($('followingFiles').files)
    ]);
    if (!followers.size || !following.size) throw new Error('File tidak berisi daftar akun yang dapat dibaca.');
    state.followers = followers;
    state.following = following;
    state.candidates = [...following].filter(user => !followers.has(user)).sort((a,b) => a.localeCompare(b));
    state.selected = new Set(state.candidates);
    await chrome.storage.local.set({ followers: [...followers], following: [...following], candidates: state.candidates, selected: [...state.selected] });
    renderStats(); renderList();
    $('fileStatus').textContent = `Selesai membaca ${followers.size.toLocaleString('id-ID')} followers dan ${following.size.toLocaleString('id-ID')} following.`;
  } catch (err) {
    $('fileStatus').textContent = err?.message || 'Gagal membaca file.';
  } finally { btn.disabled = false; btn.textContent = 'Bandingkan data'; }
});

function renderStats() {
  $('followersCount').textContent = state.followers.size.toLocaleString('id-ID');
  $('followingCount').textContent = state.following.size.toLocaleString('id-ID');
  $('mutualCount').textContent = [...state.following].filter(u => state.followers.has(u)).length.toLocaleString('id-ID');
  $('nonFollowCount').textContent = state.candidates.length.toLocaleString('id-ID');
  $('searchInput').disabled = false; $('selectVisibleBtn').disabled = false; $('clearSelectionBtn').disabled = false;
  $('queueBtn').disabled = false;
}

function getVisibleCandidates() {
  const q = $('searchInput').value.trim().toLowerCase();
  return state.candidates.filter(user => user.includes(q));
}
function renderList() {
  const list = $('accountList'); const visible = getVisibleCandidates();
  $('selectionCount').textContent = `${state.selected.size.toLocaleString('id-ID')} dipilih`;
  $('resultCount').textContent = `${visible.length.toLocaleString('id-ID')} akun ditampilkan`;
  $('listFooterText').textContent = `${state.candidates.length.toLocaleString('id-ID')} akun ditemukan dari ekspor`;
  $('queueBtn').disabled = state.selected.size === 0;
  if (!visible.length) {
    list.className = 'account-list empty-state';
    list.replaceChildren();
    const strong = document.createElement('strong'); strong.textContent = state.candidates.length ? 'Tidak ada username yang cocok' : 'Tidak ada hasil';
    const p = document.createElement('p'); p.textContent = state.candidates.length ? 'Coba kata kunci lain.' : 'Impor kedua file lalu bandingkan.';
    list.append(strong,p); return;
  }
  list.className = 'account-list'; list.replaceChildren();
  const frag = document.createDocumentFragment();
  for (const user of visible) {
    const row = document.createElement('div'); row.className = 'account-row';
    const check = document.createElement('input'); check.type = 'checkbox'; check.checked = state.selected.has(user); check.setAttribute('aria-label', `Pilih ${user}`);
    check.addEventListener('change', async () => { check.checked ? state.selected.add(user) : state.selected.delete(user); await saveSelection(); renderSelectionSummary(); });
    const avatar = document.createElement('span'); avatar.className = 'avatar'; avatar.textContent = user.slice(0,1).toUpperCase();
    const name = document.createElement('span'); name.className = 'username'; name.textContent = '@' + user;
    const link = document.createElement('a'); link.className = 'profile-link'; link.href = `https://www.instagram.com/${encodeURIComponent(user)}/`; link.target = '_blank'; link.rel = 'noreferrer'; link.textContent = 'Profil ↗';
    row.append(check,avatar,name,link); frag.append(row);
  }
  list.append(frag);
  renderSelectionSummary();
}
function renderSelectionSummary(){ $('selectionCount').textContent = `${state.selected.size.toLocaleString('id-ID')} dipilih`; $('queueBtn').disabled = state.selected.size === 0; }
async function saveSelection(){ await chrome.storage.local.set({ selected: [...state.selected] }); }
$('searchInput').addEventListener('input', renderList);
$('selectVisibleBtn').addEventListener('click', async () => { getVisibleCandidates().forEach(u => state.selected.add(u)); await saveSelection(); renderList(); });
$('clearSelectionBtn').addEventListener('click', async () => { state.selected.clear(); await saveSelection(); renderList(); });

$('queueBtn').addEventListener('click', async () => {
  if (!state.selected.size) return;
  state.queue = state.candidates.filter(u => state.selected.has(u));
  state.queueIndex = 0; state.running = true; state.waiting = false; state.currentUsername = null;
  await chrome.storage.local.set({ queue: state.queue, queueIndex: 0, queueRunning: true });
  $('queueProgress').textContent = `0 / ${state.queue.length}`;
  $('queueStatus').textContent = 'Antrean siap'; $('queueDetail').textContent = `${state.queue.length} profil masuk antrean.`;
  $('statusDot').classList.add('running'); $('stopBtn').disabled = false; $('nextBtn').disabled = false;
  $('nextBtn').textContent = 'Buka profil pertama';
  $('queuePanel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

$('nextBtn').addEventListener('click', async () => {
  if (!state.running || state.waiting) return;
  if (state.queueIndex >= state.queue.length) { finishQueue(); return; }
  const username = state.queue[state.queueIndex];
  state.currentUsername = username;
  await chrome.tabs.create({ url: `https://www.instagram.com/${encodeURIComponent(username)}/`, active: true });
  state.queueIndex++;
  await chrome.storage.local.set({ queueIndex: state.queueIndex });
  $('queueProgress').textContent = `${state.queueIndex} / ${state.queue.length}`;
  $('queueStatus').textContent = `Profil dibuka: @${username}`;
  $('queueDetail').textContent = 'Tinjau profil di tab Instagram. Jika ingin menghapus follower, lakukan secara manual di Instagram.';
  state.waiting = true;
  $('nextBtn').disabled = true;
  const delay = Math.max(15, Math.min(120, Number($('delaySelect').value) || 30));
  state.countdownEnds = Date.now() + delay * 1000;
  clearInterval(state.countdownTimer);
  state.countdownTimer = setInterval(() => {
    const remaining = Math.max(0, Math.ceil((state.countdownEnds - Date.now()) / 1000));
    $('nextBtn').textContent = remaining ? `Tunggu ${remaining} detik…` : (state.queueIndex < state.queue.length ? 'Buka profil berikutnya' : 'Selesaikan antrean');
    if (!remaining) {
      clearInterval(state.countdownTimer); state.waiting = false; $('nextBtn').disabled = false;
      $('queueDetail').textContent = state.queueIndex < state.queue.length ? 'Jeda selesai. Kembali ke tab ini untuk melanjutkan antrean.' : 'Semua profil dalam antrean sudah dibuka.';
    }
  }, 250);
});

$('stopBtn').addEventListener('click', async () => {
  clearInterval(state.countdownTimer); state.running = false; state.waiting = false;
  await chrome.storage.local.set({ queueRunning: false });
  $('queueStatus').textContent = 'Antrean dihentikan'; $('queueDetail').textContent = 'Profil yang sudah terbuka tidak ditutup otomatis.';
  $('statusDot').classList.remove('running'); $('nextBtn').disabled = true; $('stopBtn').disabled = true; $('nextBtn').textContent = 'Antrean berhenti';
});
function finishQueue(){
  state.running = false; clearInterval(state.countdownTimer);
  chrome.storage.local.set({ queueRunning: false });
  $('queueStatus').textContent = 'Antrean selesai'; $('queueDetail').textContent = 'Semua profil terpilih sudah dibuka.';
  $('statusDot').classList.remove('running'); $('nextBtn').disabled = true; $('stopBtn').disabled = true; $('nextBtn').textContent = 'Selesai';
}

(async function restore(){
  await initializeTargets();
  try {
    const saved = await chrome.storage.local.get(['followers','following','candidates','selected']);
    if (Array.isArray(saved.followers) && Array.isArray(saved.following) && Array.isArray(saved.candidates)) {
      state.followers = new Set(saved.followers); state.following = new Set(saved.following); state.candidates = saved.candidates;
      state.selected = new Set(Array.isArray(saved.selected) ? saved.selected : saved.candidates);
      renderStats(); renderList();
      $('fileStatus').textContent = 'Data tersimpan lokal dimuat kembali. Impor ulang jika ingin memperbarui snapshot.';
    }
  } catch {}
})();
