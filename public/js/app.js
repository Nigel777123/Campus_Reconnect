/* ── State ──────────────────────────────────────────────────────────── */
const state = {
  lostItems: [],
  foundItems: [],
};

/* ── Helpers ─────────────────────────────────────────────────────────── */
function $(id) { return document.getElementById(id); }

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = `form-msg ${type}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function escHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

/* ── Navigation ──────────────────────────────────────────────────────── */
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const view = document.getElementById(`view-${name}`);
  if (view) view.classList.add('active');

  const btn = document.querySelector(`.nav-btn[data-view="${name}"]`);
  if (btn) btn.classList.add('active');

  if (name === 'home') {
    fetchLostItems();
    fetchFoundItems();
  }
}

document.querySelectorAll('[data-view]').forEach(el => {
  el.addEventListener('click', () => showView(el.dataset.view));
});

/* ── Tabs ─────────────────────────────────────────────────────────────── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById(btn.dataset.tab);
    if (panel) panel.classList.add('active');
  });
});

/* ── API ─────────────────────────────────────────────────────────────── */
async function apiFetch(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/* ── Lost Items ──────────────────────────────────────────────────────── */
async function fetchLostItems() {
  const container = $('lost-items-container');
  container.innerHTML = '<p class="loading">Loading…</p>';
  try {
    state.lostItems = await apiFetch('/api/items/lost');
    renderLostItems();
  } catch (e) {
    container.innerHTML = `<p class="loading">Failed to load items: ${escHtml(e.message)}</p>`;
  }
}

function renderLostItems() {
  const container = $('lost-items-container');
  const count = $('lost-count');
  const items = state.lostItems;
  count.textContent = items.length;

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>No lost items reported yet.</p>
      </div>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="item-card" data-id="${item.id}">
      <div class="item-card-header">
        <h3>${escHtml(item.title)}</h3>
        <span class="status-chip status-${item.status}">${item.status}</span>
      </div>
      <div class="meta">
        <span>📂 ${escHtml(item.category)}</span>
        <span>📍 ${escHtml(item.location)}</span>
        <span>📅 ${formatDate(item.created_at)}</span>
      </div>
      <p class="description">${escHtml(item.description)}</p>
      ${item.reward_description || item.reward_amount > 0 ? `
        <div class="reward-badge">
          🏆 Reward:
          ${item.reward_amount > 0 ? `£${Number(item.reward_amount).toFixed(2)}` : ''}
          ${item.reward_description ? escHtml(item.reward_description) : ''}
        </div>` : ''}
    </div>
  `).join('');
}

/* ── Found Items ─────────────────────────────────────────────────────── */
async function fetchFoundItems() {
  const container = $('found-items-container');
  container.innerHTML = '<p class="loading">Loading…</p>';
  try {
    state.foundItems = await apiFetch('/api/items/found');
    renderFoundItems();
  } catch (e) {
    container.innerHTML = `<p class="loading">Failed to load items: ${escHtml(e.message)}</p>`;
  }
}

function renderFoundItems() {
  const container = $('found-items-container');
  const count = $('found-count');
  const items = state.foundItems;
  count.textContent = items.length;

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔎</div>
        <p>No found items reported yet.</p>
      </div>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="item-card" data-id="${item.id}">
      <div class="item-card-header">
        <h3>${escHtml(item.title)}</h3>
        <span class="status-chip status-${item.status}">${item.status}</span>
      </div>
      <div class="meta">
        <span>📂 ${escHtml(item.category)}</span>
        <span>📍 ${escHtml(item.location)}</span>
        <span>📅 ${formatDate(item.created_at)}</span>
      </div>
      <p class="description">${escHtml(item.description)}</p>
      <div class="verification-badge">🔐 Verification required to claim</div>
      ${item.status !== 'claimed' ? `
        <div class="item-card-footer">
          <button class="btn btn-outline btn-sm claim-btn"
                  data-id="${item.id}"
                  data-title="${escHtml(item.title)}"
                  data-question="${escHtml(item.verification_question)}">
            🔑 Claim This Item
          </button>
        </div>` : ''}
    </div>
  `).join('');

  // Attach claim button listeners
  document.querySelectorAll('.claim-btn').forEach(btn => {
    btn.addEventListener('click', () => openClaimModal(
      btn.dataset.id,
      btn.dataset.title,
      btn.dataset.question,
    ));
  });
}

/* ── Claim Modal ─────────────────────────────────────────────────────── */
function openClaimModal(id, title, question) {
  $('claim-item-id').value = id;
  $('claim-item-name').textContent = title;
  $('claim-question').textContent = question;
  $('claim-answer').value = '';
  $('claim-email').value = '';
  const msg = $('claim-msg');
  msg.className = 'form-msg hidden';
  msg.textContent = '';
  $('claim-modal').classList.remove('hidden');
}

function closeClaimModal() {
  $('claim-modal').classList.add('hidden');
}

$('claim-modal').querySelector('.modal-overlay').addEventListener('click', closeClaimModal);
$('claim-modal').querySelector('.modal-close').addEventListener('click', closeClaimModal);

$('form-claim').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id     = $('claim-item-id').value;
  const email  = $('claim-email').value.trim();
  const answer = $('claim-answer').value.trim();
  const msg    = $('claim-msg');

  if (!email || !answer) {
    showMsg(msg, 'Please fill in all fields.', 'error');
    return;
  }

  try {
    const res = await apiFetch(`/api/items/found/${id}/claim`, {
      method: 'POST',
      body: JSON.stringify({ claimer_email: email, answer }),
    });
    showMsg(msg, `✅ ${res.message} Finder's email: ${res.finder_email}`, 'success');
    fetchFoundItems(); // Refresh the list
  } catch (err) {
    showMsg(msg, `❌ ${err.message}`, 'error');
  }
});

/* ── Report Lost Form ────────────────────────────────────────────────── */
$('form-lost').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('lost-form-msg');

  const body = {
    title:              $('lost-title').value.trim(),
    description:        $('lost-description').value.trim(),
    category:           $('lost-category').value,
    location:           $('lost-location').value.trim(),
    contact_email:      $('lost-email').value.trim(),
    reward_description: $('lost-reward-desc').value.trim() || undefined,
    reward_amount:      parseFloat($('lost-reward-amount').value) || 0,
  };

  if (!body.title || !body.description || !body.category || !body.location || !body.contact_email) {
    showMsg(msg, 'Please fill in all required fields.', 'error');
    return;
  }

  try {
    await apiFetch('/api/items/lost', { method: 'POST', body: JSON.stringify(body) });
    showMsg(msg, '✅ Lost item reported successfully! We hope you find it soon.', 'success');
    e.target.reset();
  } catch (err) {
    showMsg(msg, `❌ ${err.message}`, 'error');
  }
});

/* ── Report Found Form ───────────────────────────────────────────────── */
$('form-found').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('found-form-msg');

  const body = {
    title:                 $('found-title').value.trim(),
    description:           $('found-description').value.trim(),
    category:              $('found-category').value,
    location:              $('found-location').value.trim(),
    contact_email:         $('found-email').value.trim(),
    verification_question: $('found-vq').value.trim(),
    verification_answer:   $('found-va').value.trim(),
  };

  if (!body.title || !body.description || !body.category || !body.location ||
      !body.contact_email || !body.verification_question || !body.verification_answer) {
    showMsg(msg, 'Please fill in all required fields including the verification question and answer.', 'error');
    return;
  }

  try {
    await apiFetch('/api/items/found', { method: 'POST', body: JSON.stringify(body) });
    showMsg(msg, '✅ Found item reported successfully! Thank you for your honesty.', 'success');
    e.target.reset();
  } catch (err) {
    showMsg(msg, `❌ ${err.message}`, 'error');
  }
});

/* ── Initial load ────────────────────────────────────────────────────── */
fetchLostItems();
fetchFoundItems();
