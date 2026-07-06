import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("lost_and_found.db");

// ── JWT helpers (no external deps) ──────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || "campus_reconnect_secret_2024";
const CAMPUS_EMAIL_DOMAIN = process.env.CAMPUS_EMAIL_DOMAIN || "university.edu";

function base64url(input: Buffer | string): string {
  const str = typeof input === "string" ? input : input.toString("binary");
  return Buffer.from(str, "binary")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwt(payload: object): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify({ ...payload, iat: Date.now() }));
  const sig = base64url(
    crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest()
  );
  return `${header}.${body}.${sig}`;
}

function verifyJwt(token: string): any | null {
  try {
    const [header, body, sig] = token.split(".");
    const expected = base64url(
      crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest()
    );
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(body, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

// ── Password hashing (scrypt) ────────────────────────────────────────────────
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await new Promise<string>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(key.toString("hex"));
    });
  });
  return `${salt}:${hash}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  const key = await new Promise<string>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(key.toString("hex"));
    });
  });
  return key === hash;
}

// ── Database schema ──────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'other',
    location TEXT,
    date TEXT,
    image_url TEXT,
    contact_info TEXT,
    verification_questions TEXT,
    verification_answers TEXT,
    status TEXT DEFAULT 'active',
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    claimant_id INTEGER NOT NULL,
    claimant_name TEXT,
    claimant_contact TEXT,
    submitted_answers TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(item_id) REFERENCES items(id),
    FOREIGN KEY(claimant_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(claim_id) REFERENCES claims(id),
    FOREIGN KEY(sender_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    read INTEGER DEFAULT 0,
    ref_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// ── Auth middleware ──────────────────────────────────────────────────────────
function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const payload = verifyJwt(auth.slice(7));
  if (!payload) return res.status(401).json({ error: "Invalid token" });
  req.user = payload;
  next();
}

function optionalAuth(req: any, res: any, next: any) {
  const auth = req.headers["authorization"];
  if (auth?.startsWith("Bearer ")) {
    const payload = verifyJwt(auth.slice(7));
    if (payload) req.user = payload;
  }
  next();
}

function adminOnly(req: any, res: any, next: any) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  next();
}

// ── Helper to push a notification ───────────────────────────────────────────
function notify(userId: number, type: string, title: string, body: string, refId?: number) {
  db.prepare(
    `INSERT INTO notifications (user_id, type, title, body, ref_id) VALUES (?, ?, ?, ?, ?)`
  ).run(userId, type, title, body, refId ?? null);
}

// ── Server startup ───────────────────────────────────────────────────────────
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // ── Auth routes ────────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email and password required" });

    if (!email.toLowerCase().endsWith(`@${CAMPUS_EMAIL_DOMAIN}`))
      return res.status(400).json({ error: `Only @${CAMPUS_EMAIL_DOMAIN} emails allowed` });

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
    if (existing) return res.status(400).json({ error: "Email already registered" });

    if (password.length < 8)
      return res.status(400).json({ error: "Password must be at least 8 characters" });

    const password_hash = await hashPassword(password);
    const info = db
      .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
      .run(name, email.toLowerCase(), password_hash);

    const token = signJwt({ id: info.lastInsertRowid, email: email.toLowerCase(), name, role: "user" });
    res.json({ token, user: { id: info.lastInsertRowid, name, email: email.toLowerCase(), role: "user" } });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) as any;
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signJwt({ id: user.id, email: user.email, name: user.name, role: user.role });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  app.get("/api/me", authMiddleware, (req: any, res) => {
    const user = db.prepare("SELECT id, name, email, role, created_at FROM users WHERE id = ?").get(req.user.id) as any;
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  });

  // ── Items routes ───────────────────────────────────────────────────────────
  app.get("/api/items", optionalAuth, (req: any, res) => {
    const { type, q, category, date_from, date_to, status } = req.query;
    let query = `SELECT i.*, u.name as poster_name FROM items i JOIN users u ON i.user_id = u.id WHERE 1=1`;
    const params: any[] = [];

    if (type) { query += " AND i.type = ?"; params.push(type); }
    if (category) { query += " AND i.category = ?"; params.push(category); }
    if (status) { query += " AND i.status = ?"; params.push(status); }
    else { query += " AND i.status != 'deleted'"; }
    if (date_from) { query += " AND i.date >= ?"; params.push(date_from); }
    if (date_to) { query += " AND i.date <= ?"; params.push(date_to); }
    if (q) {
      query += " AND (i.title LIKE ? OR i.description LIKE ? OR i.location LIKE ?)";
      const s = `%${q}%`;
      params.push(s, s, s);
    }

    query += " ORDER BY i.created_at DESC";
    const items = db.prepare(query).all(...params) as any[];

    // Strip private answers from public view
    const safeItems = items.map(({ verification_answers, contact_info, ...item }) => ({
      ...item,
      // Only reveal contact_info if the requesting user is the owner
      contact_info: req.user?.id === item.user_id ? contact_info : undefined,
    }));

    res.json(safeItems);
  });

  app.post("/api/items", authMiddleware, (req: any, res) => {
    const {
      type, title, description, category, location, date,
      image_url, contact_info, verification_questions, verification_answers
    } = req.body;

    if (!type || !title) return res.status(400).json({ error: "Type and title required" });

    const info = db.prepare(`
      INSERT INTO items (user_id, type, title, description, category, location, date,
        image_url, contact_info, verification_questions, verification_answers)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id, type, title, description ?? "", category ?? "other",
      location ?? "", date ?? new Date().toISOString().split("T")[0],
      image_url ?? "", contact_info ?? "",
      JSON.stringify(verification_questions ?? []),
      JSON.stringify(verification_answers ?? [])
    );

    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/items/:id", optionalAuth, (req: any, res) => {
    const item = db.prepare(
      `SELECT i.*, u.name as poster_name FROM items i JOIN users u ON i.user_id = u.id WHERE i.id = ?`
    ).get(req.params.id) as any;

    if (!item || item.status === "deleted") return res.status(404).json({ error: "Not found" });

    const isOwner = req.user?.id === item.user_id;
    const { verification_answers, contact_info, ...publicItem } = item;

    res.json({
      ...publicItem,
      verification_answers: isOwner ? verification_answers : undefined,
      contact_info: isOwner ? contact_info : undefined,
    });
  });

  app.patch("/api/items/:id", authMiddleware, (req: any, res) => {
    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id) as any;
    if (!item) return res.status(404).json({ error: "Not found" });
    if (item.user_id !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ error: "Forbidden" });

    const { status, title, description, location, contact_info } = req.body;
    const updates: string[] = [];
    const params: any[] = [];

    if (status !== undefined) { updates.push("status = ?"); params.push(status); }
    if (title !== undefined) { updates.push("title = ?"); params.push(title); }
    if (description !== undefined) { updates.push("description = ?"); params.push(description); }
    if (location !== undefined) { updates.push("location = ?"); params.push(location); }
    if (contact_info !== undefined) { updates.push("contact_info = ?"); params.push(contact_info); }
    if (status === "resolved") { updates.push("resolved_at = CURRENT_TIMESTAMP"); }

    if (updates.length === 0) return res.status(400).json({ error: "Nothing to update" });

    params.push(req.params.id);
    db.prepare(`UPDATE items SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    res.json({ success: true });
  });

  app.delete("/api/items/:id", authMiddleware, (req: any, res) => {
    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id) as any;
    if (!item) return res.status(404).json({ error: "Not found" });
    if (item.user_id !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ error: "Forbidden" });

    db.prepare("UPDATE items SET status = 'deleted' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // ── Claims routes ──────────────────────────────────────────────────────────
  app.get("/api/items/:id/claims", authMiddleware, (req: any, res) => {
    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id) as any;
    if (!item) return res.status(404).json({ error: "Not found" });
    if (item.user_id !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ error: "Forbidden" });

    const claims = db.prepare(
      `SELECT c.*, u.name as claimant_name_display, u.email as claimant_email
       FROM claims c JOIN users u ON c.claimant_id = u.id
       WHERE c.item_id = ? ORDER BY c.created_at DESC`
    ).all(req.params.id) as any[];

    // Attach item's verification answers so the owner can compare
    const answers = JSON.parse(item.verification_answers || "[]");
    res.json({ claims, verification_answers: answers });
  });

  app.post("/api/items/:id/claims", authMiddleware, (req: any, res) => {
    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id) as any;
    if (!item) return res.status(404).json({ error: "Item not found" });
    if (item.status !== "active") return res.status(400).json({ error: "Item is not active" });
    if (item.user_id === req.user.id)
      return res.status(400).json({ error: "Cannot claim your own item" });

    const { submitted_answers, claimant_contact } = req.body;
    if (!submitted_answers?.length)
      return res.status(400).json({ error: "Must answer verification questions" });

    // Check if this user already has a pending claim
    const existing = db.prepare(
      "SELECT id FROM claims WHERE item_id = ? AND claimant_id = ? AND status = 'pending'"
    ).get(req.params.id, req.user.id);
    if (existing) return res.status(400).json({ error: "You already have a pending claim for this item" });

    const info = db.prepare(`
      INSERT INTO claims (item_id, claimant_id, claimant_name, claimant_contact, submitted_answers)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      req.params.id, req.user.id, req.user.name,
      claimant_contact ?? "", JSON.stringify(submitted_answers)
    );

    // Notify the item owner
    notify(
      item.user_id, "claim_submitted",
      "New Claim on Your Item",
      `${req.user.name} submitted a claim for "${item.title}"`,
      Number(info.lastInsertRowid)
    );

    res.json({ id: info.lastInsertRowid });
  });

  app.patch("/api/claims/:id", authMiddleware, (req: any, res) => {
    const claim = db.prepare("SELECT * FROM claims WHERE id = ?").get(req.params.id) as any;
    if (!claim) return res.status(404).json({ error: "Claim not found" });

    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(claim.item_id) as any;
    if (item.user_id !== req.user.id)
      return res.status(403).json({ error: "Only the item poster can approve/reject claims" });

    const { status } = req.body;
    if (!["approved", "rejected"].includes(status))
      return res.status(400).json({ error: "Status must be approved or rejected" });

    db.prepare("UPDATE claims SET status = ? WHERE id = ?").run(status, req.params.id);

    if (status === "approved") {
      // Mark item as claimed / resolved
      db.prepare("UPDATE items SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE id = ?").run(claim.item_id);

      notify(
        claim.claimant_id, "claim_approved",
        "Claim Approved! 🎉",
        `Your claim for "${item.title}" was approved. You can now chat with the finder.`,
        claim.id
      );
    } else {
      notify(
        claim.claimant_id, "claim_rejected",
        "Claim Not Approved",
        `Your claim for "${item.title}" was not approved. You may try again.`,
        claim.id
      );
    }

    res.json({ success: true });
  });

  // ── Messages routes ────────────────────────────────────────────────────────
  app.get("/api/messages/:claimId", authMiddleware, (req: any, res) => {
    const claim = db.prepare("SELECT * FROM claims WHERE id = ?").get(req.params.claimId) as any;
    if (!claim) return res.status(404).json({ error: "Claim not found" });

    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(claim.item_id) as any;
    const isParticipant = req.user.id === claim.claimant_id || req.user.id === item.user_id;
    if (!isParticipant) return res.status(403).json({ error: "Forbidden" });
    if (claim.status !== "approved") return res.status(400).json({ error: "Claim not approved" });

    const messages = db.prepare(
      `SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON m.sender_id = u.id
       WHERE m.claim_id = ? ORDER BY m.created_at ASC`
    ).all(req.params.claimId);

    // Reveal contact info when approved
    res.json({ messages, contact_info: item.contact_info, item_title: item.title });
  });

  app.post("/api/messages/:claimId", authMiddleware, (req: any, res) => {
    const claim = db.prepare("SELECT * FROM claims WHERE id = ?").get(req.params.claimId) as any;
    if (!claim || claim.status !== "approved")
      return res.status(400).json({ error: "Cannot message on unapproved claim" });

    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(claim.item_id) as any;
    const isParticipant = req.user.id === claim.claimant_id || req.user.id === item.user_id;
    if (!isParticipant) return res.status(403).json({ error: "Forbidden" });

    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Message cannot be empty" });

    const info = db.prepare(
      "INSERT INTO messages (claim_id, sender_id, content) VALUES (?, ?, ?)"
    ).run(req.params.claimId, req.user.id, content.trim());

    // Notify the other participant
    const otherId = req.user.id === claim.claimant_id ? item.user_id : claim.claimant_id;
    notify(otherId, "new_message", "New Message", `${req.user.name}: ${content.substring(0, 60)}`, claim.id);

    res.json({ id: info.lastInsertRowid });
  });

  // ── Dashboard ──────────────────────────────────────────────────────────────
  app.get("/api/dashboard", authMiddleware, (req: any, res) => {
    const myPosts = db.prepare(
      "SELECT * FROM items WHERE user_id = ? AND status != 'deleted' ORDER BY created_at DESC"
    ).all(req.user.id);

    const myClaims = db.prepare(
      `SELECT c.*, i.title as item_title, i.type as item_type, i.status as item_status,
              i.image_url, u.name as poster_name
       FROM claims c
       JOIN items i ON c.item_id = i.id
       JOIN users u ON i.user_id = u.id
       WHERE c.claimant_id = ? ORDER BY c.created_at DESC`
    ).all(req.user.id);

    // Get pending claim counts for my posts
    const pendingClaims = db.prepare(
      `SELECT item_id, COUNT(*) as count FROM claims
       WHERE item_id IN (SELECT id FROM items WHERE user_id = ?) AND status = 'pending'
       GROUP BY item_id`
    ).all(req.user.id) as any[];

    const pendingMap: Record<number, number> = {};
    pendingClaims.forEach((r: any) => { pendingMap[r.item_id] = r.count; });

    res.json({ myPosts, myClaims, pendingMap });
  });

  // ── Notifications ──────────────────────────────────────────────────────────
  app.get("/api/notifications", authMiddleware, (req: any, res) => {
    const notifs = db.prepare(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
    ).all(req.user.id);
    res.json(notifs);
  });

  app.patch("/api/notifications/read-all", authMiddleware, (req: any, res) => {
    db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(req.user.id);
    res.json({ success: true });
  });

  // ── Admin routes ───────────────────────────────────────────────────────────
  app.get("/api/admin/items", authMiddleware, adminOnly, (req: any, res) => {
    const items = db.prepare(
      `SELECT i.*, u.name as poster_name, u.email as poster_email
       FROM items i JOIN users u ON i.user_id = u.id
       WHERE i.status != 'deleted' ORDER BY i.created_at DESC`
    ).all();
    res.json(items);
  });

  app.get("/api/admin/users", authMiddleware, adminOnly, (req: any, res) => {
    const users = db.prepare(
      "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
    ).all();
    res.json(users);
  });

  app.patch("/api/admin/users/:id/role", authMiddleware, adminOnly, (req: any, res) => {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) return res.status(400).json({ error: "Invalid role" });
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/admin/items/:id", authMiddleware, adminOnly, (req: any, res) => {
    db.prepare("UPDATE items SET status = 'deleted' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/stats", authMiddleware, adminOnly, (req: any, res) => {
    const totalItems = (db.prepare("SELECT COUNT(*) as c FROM items WHERE status != 'deleted'").get() as any).c;
    const activeItems = (db.prepare("SELECT COUNT(*) as c FROM items WHERE status = 'active'").get() as any).c;
    const resolvedItems = (db.prepare("SELECT COUNT(*) as c FROM items WHERE status = 'resolved'").get() as any).c;
    const totalUsers = (db.prepare("SELECT COUNT(*) as c FROM users").get() as any).c;
    const totalClaims = (db.prepare("SELECT COUNT(*) as c FROM claims").get() as any).c;
    const pendingClaims = (db.prepare("SELECT COUNT(*) as c FROM claims WHERE status = 'pending'").get() as any).c;
    res.json({ totalItems, activeItems, resolvedItems, totalUsers, totalClaims, pendingClaims });
  });

  // ── Vite / static ──────────────────────────────────────────────────────────
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
    console.log(`\n🎓 Campus Reconnect running on http://localhost:${PORT}`);
    console.log(`   Campus domain: @${CAMPUS_EMAIL_DOMAIN}\n`);
  });
}

startServer();
