const request = require('supertest');
const path    = require('path');
const fs      = require('fs');
const os      = require('os');

// Use a temporary DB file so tests don't pollute production data
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cr-test-'));
const dbPath = path.join(tmpDir, 'test.json');
process.env.DB_PATH = dbPath;

const app = require('../server');

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ─── Lost Items ────────────────────────────────────────────────────────────

describe('POST /api/items/lost', () => {
  it('creates a lost item and returns 201', async () => {
    const res = await request(app)
      .post('/api/items/lost')
      .send({
        title: 'Blue backpack',
        description: 'Left at library 2nd floor',
        category: 'Bag / Backpack',
        location: 'Library',
        contact_email: 'owner@uni.edu',
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Blue backpack');
    expect(res.body.status).toBe('open');
    expect(res.body.id).toBeDefined();
  });

  it('returns 201 with reward fields when provided', async () => {
    const res = await request(app)
      .post('/api/items/lost')
      .send({
        title: 'Laptop',
        description: 'Silver laptop with stickers',
        category: 'Electronics',
        location: 'Cafeteria',
        contact_email: 'student@uni.edu',
        reward_description: '£10 gift card',
        reward_amount: 10,
      });
    expect(res.status).toBe(201);
    expect(res.body.reward_description).toBe('£10 gift card');
    expect(res.body.reward_amount).toBe(10);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/items/lost')
      .send({ title: 'No contact' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing required fields/);
  });
});

describe('GET /api/items/lost', () => {
  it('returns an array of lost items', async () => {
    const res = await request(app).get('/api/items/lost');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── Found Items ───────────────────────────────────────────────────────────

describe('POST /api/items/found', () => {
  it('creates a found item, returns 201, and hides the verification answer', async () => {
    const res = await request(app)
      .post('/api/items/found')
      .send({
        title: 'Silver keys',
        description: 'Set of three keys on a red lanyard',
        category: 'Keys',
        location: 'Gym entrance',
        contact_email: 'finder@uni.edu',
        verification_question: 'What colour is the lanyard?',
        verification_answer: 'Red',
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Silver keys');
    expect(res.body.status).toBe('unclaimed');
    expect(res.body.verification_question).toBe('What colour is the lanyard?');
    // Answer must NOT be exposed
    expect(res.body.verification_answer).toBeUndefined();
  });

  it('returns 400 when verification fields are missing', async () => {
    const res = await request(app)
      .post('/api/items/found')
      .send({
        title: 'Wallet',
        description: 'Black leather wallet',
        category: 'Wallet / ID',
        location: 'Canteen',
        contact_email: 'finder2@uni.edu',
        // missing verification_question and verification_answer
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing required fields/);
  });
});

describe('GET /api/items/found', () => {
  it('returns found items without verification_answer', async () => {
    const res = await request(app).get('/api/items/found');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach(item => {
      expect(item.verification_answer).toBeUndefined();
    });
  });
});

// ─── Claim Flow ────────────────────────────────────────────────────────────

describe('POST /api/items/found/:id/claim', () => {
  let foundItemId;

  beforeAll(async () => {
    // Create a fresh found item for claim tests
    const res = await request(app)
      .post('/api/items/found')
      .send({
        title: 'Umbrella',
        description: 'Blue umbrella with white dots',
        category: 'Other',
        location: 'Bus stop',
        contact_email: 'umbrella-finder@uni.edu',
        verification_question: 'What pattern is on the umbrella?',
        verification_answer: 'White dots',
      });
    foundItemId = res.body.id;
  });

  it('rejects an incorrect answer with 403', async () => {
    const res = await request(app)
      .post(`/api/items/found/${foundItemId}/claim`)
      .send({ claimer_email: 'wrong@uni.edu', answer: 'stripes' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Incorrect/);
  });

  it('approves the correct answer (case-insensitive) with 200', async () => {
    const res = await request(app)
      .post(`/api/items/found/${foundItemId}/claim`)
      .send({ claimer_email: 'owner@uni.edu', answer: 'WHITE DOTS' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.finder_email).toBe('umbrella-finder@uni.edu');
  });

  it('returns 409 if the item has already been claimed', async () => {
    const res = await request(app)
      .post(`/api/items/found/${foundItemId}/claim`)
      .send({ claimer_email: 'late@uni.edu', answer: 'white dots' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already been claimed/);
  });

  it('returns 404 for a non-existent item', async () => {
    const res = await request(app)
      .post('/api/items/found/99999/claim')
      .send({ claimer_email: 'x@uni.edu', answer: 'anything' });
    expect(res.status).toBe(404);
  });

  it('returns 400 when claimer_email or answer is missing', async () => {
    const res = await request(app)
      .post(`/api/items/found/${foundItemId}/claim`)
      .send({ claimer_email: 'x@uni.edu' }); // missing answer
    expect(res.status).toBe(400);
  });
});
