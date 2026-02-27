const express = require('express');
const router = express.Router();
const { loadStore, saveStore } = require('../db');

// Normalize answer for case-insensitive comparison
function normalizeAnswer(answer) {
  return answer.trim().toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

// ─── Lost Items ────────────────────────────────────────────────────────────

// GET /api/items/lost  — list all lost items (newest first)
router.get('/lost', (req, res) => {
  const store = loadStore();
  const items = [...store.lostItems].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  res.json(items);
});

// POST /api/items/lost  — report a lost item
router.post('/lost', (req, res) => {
  const { title, description, category, location, contact_email,
          reward_description, reward_amount } = req.body;

  if (!title || !description || !category || !location || !contact_email) {
    return res.status(400).json({
      error: 'Missing required fields: title, description, category, location, contact_email',
    });
  }

  const store = loadStore();
  const item = {
    id:                 store.nextIds.lostItems++,
    title:              String(title),
    description:        String(description),
    category:           String(category),
    location:           String(location),
    contact_email:      String(contact_email),
    reward_description: reward_description ? String(reward_description) : null,
    reward_amount:      typeof reward_amount === 'number' ? reward_amount : 0,
    status:             'open',
    created_at:         nowIso(),
  };
  store.lostItems.push(item);
  saveStore(store);
  res.status(201).json(item);
});

// ─── Found Items ───────────────────────────────────────────────────────────

// GET /api/items/found  — list found items (answer excluded from response)
router.get('/found', (req, res) => {
  const store = loadStore();
  const items = [...store.foundItems]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(({ verification_answer, ...safe }) => safe);  // never expose the answer
  res.json(items);
});

// POST /api/items/found  — report a found item
router.post('/found', (req, res) => {
  const { title, description, category, location, contact_email,
          verification_question, verification_answer } = req.body;

  if (!title || !description || !category || !location || !contact_email ||
      !verification_question || !verification_answer) {
    return res.status(400).json({
      error: 'Missing required fields: title, description, category, location, contact_email, verification_question, verification_answer',
    });
  }

  const store = loadStore();
  const item = {
    id:                    store.nextIds.foundItems++,
    title:                 String(title),
    description:           String(description),
    category:              String(category),
    location:              String(location),
    contact_email:         String(contact_email),
    verification_question: String(verification_question),
    verification_answer:   normalizeAnswer(String(verification_answer)),
    status:                'unclaimed',
    created_at:            nowIso(),
  };
  store.foundItems.push(item);
  saveStore(store);

  // Return without the answer
  const { verification_answer: _hidden, ...safe } = item;
  res.status(201).json(safe);
});

// ─── Claim Flow ────────────────────────────────────────────────────────────

// POST /api/items/found/:id/claim  — attempt to claim a found item
router.post('/found/:id/claim', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { claimer_email, answer } = req.body;

  if (!claimer_email || !answer) {
    return res.status(400).json({ error: 'Missing required fields: claimer_email, answer' });
  }

  const store = loadStore();
  const item = store.foundItems.find(i => i.id === id);

  if (!item) {
    return res.status(404).json({ error: 'Found item not found' });
  }

  if (item.status === 'claimed') {
    return res.status(409).json({ error: 'This item has already been claimed' });
  }

  const isCorrect = normalizeAnswer(String(answer)) === item.verification_answer;

  const claim = {
    id:            store.nextIds.claims++,
    found_item_id: item.id,
    claimer_email: String(claimer_email),
    answer_given:  String(answer),
    status:        isCorrect ? 'approved' : 'rejected',
    created_at:    nowIso(),
  };
  store.claims.push(claim);

  if (!isCorrect) {
    saveStore(store);
    return res.status(403).json({ error: 'Incorrect verification answer. Please try again.' });
  }

  item.status = 'claimed';
  saveStore(store);

  res.json({
    success: true,
    message: 'Verification successful! Contact the finder to arrange the return of your item.',
    finder_email: item.contact_email,
  });
});

module.exports = router;
