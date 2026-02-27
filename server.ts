import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("lost_and_found.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- 'lost' or 'found'
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    location TEXT,
    date TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'claimed', 'returned'
    contact_info TEXT,
    verification_question TEXT,
    reward TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    claimant_name TEXT,
    claimant_contact TEXT,
    verification_answer TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(item_id) REFERENCES items(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/items", (req, res) => {
    const { type, q } = req.query;
    let query = "SELECT * FROM items WHERE status = 'active'";
    const params = [];

    if (type) {
      query += " AND type = ?";
      params.push(type);
    }
    if (q) {
      query += " AND (title LIKE ? OR description LIKE ? OR location LIKE ?)";
      const search = `%${q}%`;
      params.push(search, search, search);
    }

    query += " ORDER BY created_at DESC";
    const items = db.prepare(query).all(...params);
    res.json(items);
  });

  app.post("/api/items", (req, res) => {
    const { type, title, description, category, location, date, image_url, contact_info, verification_question, reward } = req.body;
    const stmt = db.prepare(`
      INSERT INTO items (type, title, description, category, location, date, image_url, contact_info, verification_question, reward)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(type, title, description, category, location, date, image_url, contact_info, verification_question, reward);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/items/:id", (req, res) => {
    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  });

  app.post("/api/claims", (req, res) => {
    const { item_id, claimant_name, claimant_contact, verification_answer } = req.body;
    const stmt = db.prepare(`
      INSERT INTO claims (item_id, claimant_name, claimant_contact, verification_answer)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(item_id, claimant_name, claimant_contact, verification_answer);
    res.json({ id: info.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
