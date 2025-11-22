async function loadStats() {
  const path = location.pathname.split('/');
  const code = path[2];
  const content = document.getElementById('content');

  try {
    const res = await fetch('/api/links/' + code);
    if (!res.ok) {
      content.innerHTML = '<p class="empty">Code not found.</p>';
      return;
    }

    const j = await res.json();

    content.innerHTML = `
      <h2>Code: <span class="code">${j.code}</span></h2>
      <p>Target: <a href="${j.url}" target="_blank" rel="noopener">${j.url}</a></p>
      <div class="stat-row"><strong>Clicks:</strong> ${j.clicks}</div>
      <div class="stat-row"><strong>Last clicked:</strong> ${j.last_clicked ? new Date(j.last_clicked).toLocaleString() : 'Never'}</div>
      <div class="stat-row"><strong>Created:</strong> ${new Date(j.created_at).toLocaleString()}</div>

      <div style="margin-top:12px;">
        <a class="btn" href="/${j.code}" target="_blank" rel="noopener">Open short URL</a>
        <a class="btn danger" id="delBtn">Delete</a>
      </div>
    `;

    document.getElementById('delBtn').addEventListener('click', async () => {
      if (!confirm('Delete this link?')) return;

      const r = await fetch('/api/links/' + j.code, { method: 'DELETE' });

      if (r.status === 204) {
        alert('Deleted');
        location.href = '/';
      } else {
        alert('Delete failed');
      }
    });

  } catch (e) {
    content.innerHTML = '<p class="empty">Error loading.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadStats);
