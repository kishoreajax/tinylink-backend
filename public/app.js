// app.js - client logic (modern/professional)
const apiBase = '/api/links';
const form = document.getElementById('createForm');
const urlInput = document.getElementById('url');
const codeInput = document.getElementById('code');
const submitBtn = document.getElementById('submitBtn');
const msg = document.getElementById('formMsg');
const tbody = document.getElementById('linksTbody');
const search = document.getElementById('search');

function shortify(url, n=60){ return url.length>n? url.slice(0,n-1)+'…': url; }

async function listLinks(q='') {
  try {
    const res = await fetch(apiBase);
    const rows = await res.json();
    let filtered = rows;
    if (q) {
      const qq = q.toLowerCase();
      filtered = rows.filter(r => (r.code && r.code.toLowerCase().includes(qq)) || (r.url && r.url.toLowerCase().includes(qq)));
    }
    tbody.innerHTML = '';
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty">No links yet.</td></tr>'; return;
    }
    for (const r of filtered) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><a href="/code/${r.code}">${r.code}</a></td>
        <td title="${r.url}"><a href="${r.url}" target="_blank" rel="noopener">${shortify(r.url,70)}</a></td>
        <td>${r.clicks}</td>
        <td>${r.last_clicked ? new Date(r.last_clicked).toLocaleString() : '—'}</td>
        <td>
          <button class="btn copy" data-code="${r.code}">Copy</button>
          <button class="btn danger del" data-code="${r.code}">Delete</button>
        </td>`;
      tbody.appendChild(tr);
    }
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">Failed to load links.</td></tr>';
  }
}

tbody?.addEventListener('click', async (ev) => {
  const t = ev.target;
  if (t.matches('.del')) {
    const code = t.dataset.code;
    if (!confirm(`Delete ${code}?`)) return;
    const r = await fetch(apiBase + '/' + code, { method: 'DELETE' });
    if (r.status === 204) listLinks(search.value);
    else alert('Delete failed');
  } else if (t.matches('.copy')) {
    const code = t.dataset.code;
    const u = `${location.origin}/${code}`;
    try {
      await navigator.clipboard.writeText(u);
      t.textContent = 'Copied';
      setTimeout(()=>t.textContent='Copy', 1500);
    } catch { alert('Copy failed'); }
  }
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true; msg.textContent = '';
  const payload = { url: urlInput.value.trim() };
  if (codeInput.value.trim()) payload.code = codeInput.value.trim();
  try {
    const r = await fetch(apiBase, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if (r.status === 201) {
      const j = await r.json();
      msg.style.color = 'green'; msg.textContent = `Created ${j.shortUrl}`;
      urlInput.value=''; codeInput.value='';
      listLinks();
    } else {
      const ebody = await r.json();
      msg.style.color = 'var(--danger)'; msg.textContent = ebody.error || 'Error';
    }
  } catch (err) {
    msg.style.color = 'var(--danger)'; msg.textContent = 'Network error';
  } finally { submitBtn.disabled = false; }
});

search?.addEventListener('input', () => listLinks(search.value));
document.addEventListener('DOMContentLoaded', ()=> listLinks());
