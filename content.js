(() => {
  if (window.__igRemoveFollowersV5) return;
  window.__igRemoveFollowersV5 = true;
  const EXCLUDED = new Set(['accounts','explore','direct','p','reel','reels','stories','about','developer','legal','privacy','terms','challenge','emails','web','tv']);
  let targets = new Set(), panel, status, list, running = false, stopRequested = false, mode = 'followers', deferredPrivate = []; 
  const norm = href => {
    try {
      const u = new URL(href, location.origin);
      if (!/(^|\.)instagram\.com$/i.test(u.hostname)) return null;
      const parts = u.pathname.split('/').filter(Boolean).map(decodeURIComponent);
      if (parts[0] === '_u') parts.shift();
      const user = parts.length === 1 ? parts[0].toLowerCase() : '';
      return /^[a-z0-9._]{1,30}$/.test(user) && !EXCLUDED.has(user) ? user : null;
    } catch { return null; }
  };
  const text = el => (el?.innerText || el?.textContent || '').replace(/\s+/g,' ').trim().toLowerCase();
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  function buttons(el) { return [...(el?.querySelectorAll?.('button,[role="button"]') || [])]; }
  function isRemoveLabel(t) { return /^(remove|hapus|entfernen|supprimer|eliminar|rimuovi|verwijderen)$/i.test(t); }
  function isFollowingLabel(t) { return /^(following|mengikuti|abonnements|abonné|siguiendo|seguiti|volgend|angefordert|requested)$/i.test(t); }
  function isUnfollowLabel(t) { return /^(unfollow|berhenti mengikuti|batal mengikuti|nicht mehr folgen|ne plus suivre|dejar de seguir|smetti di seguire|niet meer volgen)$/i.test(t); }
  function isPrivateRow(row) { return /private account|akun privat|akun pribadi|this account is private|account is private/i.test(text(row)) || buttons(row).some(b => /^(requested|diminta|diminta mengikuti|requested)$/i.test(text(b))); }
  function findRow(anchor) {
    let el = anchor;
    for (let i=0; i<8 && el && el !== document.body; i++, el=el.parentElement) {
      if (buttons(el).some(b => isRemoveLabel(text(b)))) return el;
    }
    return null;
  }
  function profileInRow(row) {
    return [...row.querySelectorAll('a[href]')].map(a => norm(a.getAttribute('href') || '')).find(Boolean) || null;
  }
  function getRemoveButton(row) { return buttons(row).find(b => isRemoveLabel(text(b)) && !b.disabled) || null; }
  function setStatus(s) { if (status) status.textContent = s; }
  function createPanel() {
    if (panel || !document.body) return;
    panel = document.createElement('aside'); panel.id='igremove-v5-panel';
    panel.innerHTML = `<div class="head"><strong>Instagram Account Cleaner · v6</strong><button id="igremove-close" aria-label="Tutup">×</button></div><div class="actions modes"><button id="igremove-mode-followers">Hapus Pengikut</button><button id="igremove-mode-following">Hapus Mengikuti</button></div><div class="status">Memuat daftar target…</div><div class="actions"><button id="igremove-scan">Pindai Followers</button><button id="igremove-start">Mulai otomatis</button><button id="igremove-stop" disabled>Berhenti</button></div><div class="list"></div><div id="igremove-deferred" hidden><strong>Akun privat yang dilewati</strong><div id="igremove-deferred-list"></div><button id="igremove-confirm-deferred">Konfirmasi unfollow akun privat</button></div><div class="foot">Mode Pengikut: Remove target yang cocok. Mode Mengikuti: unfollow target yang cocok; akun yang terdeteksi privat dilewati dan ditampilkan di akhir untuk konfirmasi terpisah. Jeda 12 detik per akun.</div>`;
    document.body.append(panel); status=panel.querySelector('.status'); list=panel.querySelector('.list');
    panel.querySelector('#igremove-close').onclick=()=>{ stopRequested=true; panel.remove(); panel=null; };
    panel.querySelector('#igremove-scan').onclick=()=>mode==='followers'?scan():scanFollowing();
    panel.querySelector('#igremove-start').onclick=()=>mode==='followers'?startAutomation():startFollowingAutomation();
    panel.querySelector('#igremove-mode-followers').onclick=()=>setMode('followers');
    panel.querySelector('#igremove-mode-following').onclick=()=>setMode('following');
    panel.querySelector('#igremove-confirm-deferred').onclick=confirmDeferredPrivate;
    panel.querySelector('#igremove-stop').onclick=()=>{stopRequested=true; running=false; panel?.querySelector('#igremove-start') && (panel.querySelector('#igremove-start').disabled=false); panel?.querySelector('#igremove-stop') && (panel.querySelector('#igremove-stop').disabled=true); setStatus('Permintaan berhenti diterima. Tidak akan memulai akun berikutnya.');};
    const style=document.createElement('style');
    style.textContent=`#igremove-v5-panel{position:fixed;z-index:2147483647;right:18px;bottom:18px;width:360px;max-height:78vh;display:flex;flex-direction:column;background:#10151f;color:#f1f5f9;border:1px solid #39465a;border-radius:14px;box-shadow:0 18px 60px #0008;font:13px/1.4 Arial,sans-serif;overflow:hidden}#igremove-v5-panel *{box-sizing:border-box}#igremove-v5-panel .head{padding:12px 14px;background:#1b2637;display:flex;align-items:center;justify-content:space-between}#igremove-v5-panel .head button{font-size:22px;background:none;color:white;border:0;cursor:pointer}#igremove-v5-panel .status{padding:10px 14px;color:#c8d4e4}#igremove-v5-panel .actions{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 10px}#igremove-v5-panel .actions button,#igremove-v5-panel .item button{border:0;border-radius:7px;padding:8px 9px;background:#315fb6;color:white;font-weight:700;cursor:pointer}#igremove-v5-panel .actions button:nth-child(2){background:#a33d42}#igremove-v5-panel button:disabled{opacity:.4;cursor:default}#igremove-v5-panel .list{overflow:auto;padding:0 10px 10px}#igremove-v5-panel .item{display:flex;align-items:center;gap:8px;padding:8px 4px;border-top:1px solid #283244}#igremove-v5-panel .item span{flex:1;overflow-wrap:anywhere}#igremove-v5-panel .foot{padding:9px 13px;background:#171f2c;color:#a8b5c7;font-size:11px}#igremove-v5-panel #igremove-deferred{padding:10px;border-top:1px solid #39465a}#igremove-v5-panel #igremove-deferred-list{max-height:120px;overflow:auto;margin:7px 0}#igremove-v5-panel #igremove-confirm-deferred{border:0;border-radius:7px;padding:8px 9px;background:#a33d42;color:white;font-weight:700;cursor:pointer}#igremove-v5-panel .modes button{flex:1}`;
    document.documentElement.append(style);
  }
  async function loadTargets() {
    try {
      const saved=await chrome.storage.local.get(['targetUsers']);
      targets=new Set(Array.isArray(saved.targetUsers)&&saved.targetUsers.length?saved.targetUsers.map(x=>String(x).trim().replace(/^@/,'').toLowerCase()):[]);
      if (!targets.size) {
        const response=await fetch(chrome.runtime.getURL('targets.txt'));
        if(!response.ok) throw new Error('File target bawaan gagal dimuat. Buka dashboard ekstensi sekali, lalu reload tab.');
        targets=new Set((await response.text()).split(/\r?\n/).map(x=>x.trim().replace(/^@/,'').toLowerCase()).filter(x=>/^[a-z0-9._]{1,30}$/.test(x)));
        await chrome.storage.local.set({targetUsers:[...targets]});
      }
      setStatus(targets.size ? `${targets.size} target dimuat. Buka daftar yang sesuai, lalu pindai.` : 'Daftar target kosong. Impor username melalui dashboard ekstensi terlebih dahulu.');
    } catch(e) { setStatus(e.message || 'Gagal memuat target.'); }
  }
  function scan() {
    if(!panel) return new Map();
    list.replaceChildren();
    const found=new Map();
    for(const a of document.querySelectorAll('a[href]')) {
      const user=norm(a.getAttribute('href')||'');
      if(!user || !targets.has(user) || found.has(user)) continue;
      const row=findRow(a); if(!row || profileInRow(row)!==user) continue;
      const remove=getRemoveButton(row); if(remove) found.set(user,{row});
    }
    if(!found.size) { setStatus('Tidak ada target yang cocok di bagian Followers yang sedang tampil. Pastikan dialog Pengikut terbuka, lalu scroll dan pindai lagi.'); return found; }
    setStatus(`${found.size} target cocok terlihat. Klik Mulai otomatis untuk memproses akun yang sedang tampil.`);
    for(const [user] of found) {
      const line=document.createElement('div'); line.className='item';
      const label=document.createElement('span'); label.textContent='@'+user;
      const tag=document.createElement('small'); tag.textContent='Cocok'; tag.style.color='#9fc6a8';
      line.append(label,tag); list.append(line);
    }
    return found;
  }
  function dialogCandidates() {
    const roots=[...document.querySelectorAll('[role="dialog"], [aria-modal="true"]')];
    const scope=roots.length ? roots[roots.length-1] : document;
    return buttons(scope).filter(b=>isRemoveLabel(text(b)) && b.isConnected && !b.disabled);
  }
  async function confirmRemoveDialog() {
    // Only click a Remove button inside a visible Instagram confirmation dialog.
    const deadline=Date.now()+4500;
    while(Date.now()<deadline && !stopRequested) {
      const dialogs=[...document.querySelectorAll('[role="dialog"], [aria-modal="true"]')].filter(el=>el.getClientRects().length);
      for(const d of dialogs) {
        const words=text(d);
        if(!/remove follower|remove this follower|hapus pengikut|hapus pengikut ini|remove/i.test(words)) continue;
        const btn=buttons(d).find(b=>isRemoveLabel(text(b)) && b.getClientRects().length && !b.disabled);
        if(btn) { btn.click(); return true; }
      }
      await sleep(250);
    }
    return false;
  }
  async function startAutomation() {
    if(running) return;
    if(!location.pathname.includes('/')) return;
    const found=scan();
    if(!found.size) return;
    running=true; stopRequested=false;
    panel.querySelector('#igremove-start').disabled=true; panel.querySelector('#igremove-stop').disabled=false;
    let processed=0, failures=0;
    try {
      for(const [user] of found) {
        if(stopRequested || !panel) break;
        // Re-scan the live DOM immediately before every destructive action.
        let row=null;
        for(const a of document.querySelectorAll('a[href]')) {
          if(norm(a.getAttribute('href')||'')!==user) continue;
          const candidate=findRow(a);
          if(candidate && profileInRow(candidate)===user && getRemoveButton(candidate)) { row=candidate; break; }
        }
        if(!row) { failures++; setStatus(`Lewati @${user}: baris tidak lagi ditemukan. Lanjut dalam 12 detik.`); await sleep(12000); continue; }
        const remove=getRemoveButton(row);
        if(!remove || profileInRow(row)!==user) { failures++; await sleep(12000); continue; }
        setStatus(`Memproses @${user} (${processed+1}/${found.size}).`);
        remove.click();
        const confirmed=await confirmRemoveDialog();
        if(confirmed) { processed++; setStatus(`Dialog untuk @${user} dikonfirmasi. Jeda 12 detik sebelum target berikutnya.`); }
        else { failures++; setStatus(`Tidak menemukan dialog konfirmasi untuk @${user}. Proses dihentikan demi keamanan.`); break; }
        await sleep(12000);
      }
      setStatus(stopRequested?`Dihentikan. Berhasil diproses: ${processed}; dilewati/gagal: ${failures}. Scroll daftar Followers lalu pindai lagi untuk batch berikutnya.`:`Batch selesai. Dialog dikonfirmasi: ${processed}; dilewati/gagal: ${failures}. Scroll daftar Followers lalu pindai lagi untuk batch berikutnya.`);
    } finally {
      running=false;
      if(panel) { panel.querySelector('#igremove-start').disabled=false; panel.querySelector('#igremove-stop').disabled=true; }
    }
  }
  function setMode(next) {
    if (running) return;
    mode = next;
    panel.querySelector('#igremove-scan').textContent = next === 'followers' ? 'Pindai Followers' : 'Pindai Following';
    panel.querySelector('#igremove-start').textContent = next === 'followers' ? 'Mulai hapus pengikut' : 'Mulai unfollow';
    panel.querySelector('#igremove-mode-followers').style.opacity = next === 'followers' ? '1' : '.65';
    panel.querySelector('#igremove-mode-following').style.opacity = next === 'following' ? '1' : '.65';
    setStatus(next === 'followers' ? 'Mode hapus pengikut aktif. Buka daftar Followers.' : 'Mode hapus mengikuti aktif. Buka daftar Following.');
    list.replaceChildren();
    panel.querySelector('#igremove-deferred').hidden = true;
  }
  function findFollowingRow(anchor) {
    let el = anchor;
    for (let i=0; i<8 && el && el !== document.body; i++, el=el.parentElement) {
      if (buttons(el).some(b => isFollowingLabel(text(b)) || isUnfollowLabel(text(b)))) return el;
    }
    return null;
  }
  function getFollowingButton(row) { return buttons(row).find(b => isFollowingLabel(text(b)) && !b.disabled) || null; }
  function scanFollowing() {
    if (!panel) return new Map();
    list.replaceChildren(); deferredPrivate = [];
    const found = new Map();
    for (const a of document.querySelectorAll('a[href]')) {
      const user = norm(a.getAttribute('href') || '');
      if (!user || !targets.has(user) || found.has(user)) continue;
      const row = findFollowingRow(a);
      if (!row || profileInRow(row) !== user) continue;
      if (isPrivateRow(row)) { deferredPrivate.push(user); continue; }
      if (getFollowingButton(row)) found.set(user, {row});
    }
    for (const [user] of found) addListItem(user, 'Siap');
    if (!found.size && !deferredPrivate.length) setStatus('Tidak ada target yang cocok pada daftar Following yang sedang tampil. Scroll lalu pindai lagi.');
    else setStatus(`${found.size} target siap diproses; ${deferredPrivate.length} akun privat dilewati untuk ditinjau di akhir.`);
    return found;
  }
  function addListItem(user, labelText) {
    const line=document.createElement('div'); line.className='item';
    const label=document.createElement('span'); label.textContent='@'+user;
    const tag=document.createElement('small'); tag.textContent=labelText; tag.style.color='#b7d4ff';
    line.append(label,tag); list.append(line);
  }
  async function clickUnfollowForRow(row) {
    const follow = getFollowingButton(row);
    if (!follow || profileInRow(row) == null) return false;
    follow.click();
    const deadline = Date.now() + 4000;
    while (Date.now() < deadline && !stopRequested) {
      const options = [...document.querySelectorAll('[role="dialog"], [role="menu"], [role="listbox"], button, [role="button"]')]
        .filter(el => el.getClientRects().length && isUnfollowLabel(text(el)) && !el.disabled);
      const option = options[options.length - 1];
      if (option) {
        option.click();
        await sleep(350);
        const dialogs = [...document.querySelectorAll('[role="dialog"], [aria-modal="true"]')].filter(el => el.getClientRects().length);
        for (const d of dialogs) {
          const confirm = buttons(d).find(b => isUnfollowLabel(text(b)) && !b.disabled && b.getClientRects().length);
          if (confirm) { confirm.click(); return true; }
        }
        return true;
      }
      await sleep(200);
    }
    return false;
  }
  async function startFollowingAutomation() {
    if (running) return;
    const found = scanFollowing();
    if (!found.size && !deferredPrivate.length) return;
    running = true; stopRequested = false;
    panel.querySelector('#igremove-start').disabled = true;
    panel.querySelector('#igremove-stop').disabled = false;
    let done=0, failed=0;
    try {
      for (const [user] of found) {
        if (stopRequested || !panel) break;
        let row = null;
        for (const a of document.querySelectorAll('a[href]')) {
          if (norm(a.getAttribute('href') || '') !== user) continue;
          const candidate = findFollowingRow(a);
          if (candidate && profileInRow(candidate) === user && getFollowingButton(candidate) && !isPrivateRow(candidate)) { row=candidate; break; }
        }
        if (!row) { failed++; setStatus(`Lewati @${user}: baris tidak lagi terlihat.`); continue; }
        setStatus(`Unfollow @${user} (${done+1}/${found.size})…`);
        const ok = await clickUnfollowForRow(row);
        if (ok) done++; else { failed++; setStatus(`Tidak dapat menemukan tindakan Unfollow untuk @${user}. Proses dihentikan.`); break; }
        await sleep(12000);
      }
      showDeferredPrivate();
      setStatus(`${stopRequested?'Dihentikan':'Batch Following selesai'}. Diproses: ${done}; gagal/dilewati: ${failed}; akun privat menunggu konfirmasi: ${deferredPrivate.length}.`);
    } finally {
      running=false;
      if(panel) { panel.querySelector('#igremove-start').disabled=false; panel.querySelector('#igremove-stop').disabled=true; }
    }
  }
  function showDeferredPrivate() {
    const box=panel.querySelector('#igremove-deferred');
    const inner=panel.querySelector('#igremove-deferred-list'); inner.replaceChildren();
    if (!deferredPrivate.length) { box.hidden=true; return; }
    box.hidden=false;
    for (const user of deferredPrivate) { const line=document.createElement('div'); line.className='item'; line.textContent='@'+user; inner.append(line); }
  }
  async function confirmDeferredPrivate() {
    if (running || !deferredPrivate.length) return;
    const approved = window.confirm(`Unfollow ${deferredPrivate.length} akun privat yang dilewati? Tindakan ini akan mengubah daftar Following.`);
    if (!approved) return;
    running=true; stopRequested=false;
    panel.querySelector('#igremove-confirm-deferred').disabled=true;
    let done=0, failed=0;
    try {
      for (const user of [...deferredPrivate]) {
        if (stopRequested || !panel) break;
        let row=null;
        for (const a of document.querySelectorAll('a[href]')) {
          if (norm(a.getAttribute('href') || '') !== user) continue;
          const candidate=findFollowingRow(a);
          if (candidate && profileInRow(candidate)===user && getFollowingButton(candidate)) { row=candidate; break; }
        }
        if (!row) { failed++; continue; }
        setStatus(`Unfollow akun privat @${user}…`);
        if (await clickUnfollowForRow(row)) { done++; deferredPrivate=deferredPrivate.filter(x=>x!==user); } else failed++;
        await sleep(12000);
      }
      showDeferredPrivate();
      setStatus(`Konfirmasi akun privat selesai. Diproses: ${done}; gagal/tidak terlihat: ${failed}; tersisa: ${deferredPrivate.length}.`);
    } finally { running=false; if(panel) panel.querySelector('#igremove-confirm-deferred').disabled=false; }
  }
  function init(){createPanel();loadTargets();}
  chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.targetUsers)loadTargets();});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
