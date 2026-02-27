const fs   = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'campus_reconnect.json');

const EMPTY_STORE = () => ({
  lostItems:  [],
  foundItems: [],
  claims:     [],
  nextIds:    { lostItems: 1, foundItems: 1, claims: 1 },
});

function loadStore() {
  if (fs.existsSync(DB_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch (_) { /* corrupt file — start fresh */ }
  }
  return EMPTY_STORE();
}

function saveStore(store) {
  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), 'utf8');
}

module.exports = { loadStore, saveStore, EMPTY_STORE };
