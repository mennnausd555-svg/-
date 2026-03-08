import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('database.sqlite');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password TEXT,
    profile_pic TEXT,
    social_links TEXT,
    plain_password TEXT,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'pending',
    expires_at DATETIME,
    usage_limit INTEGER DEFAULT 5,
    usage_period TEXT DEFAULT 'daily',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS scripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    inputs TEXT,
    content TEXT,
    is_saved INTEGER DEFAULT 0,
    video_link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    files TEXT,
    links TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Initial Settings
  INSERT OR IGNORE INTO settings (key, value) VALUES ('auto_activate', '0');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('default_clicks', '5');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('site_config', '{}');

  -- Migration: Add new columns if they don't exist
  PRAGMA table_info(users);
`);

// Helper to add column if not exists
const addColumn = (table: string, column: string, type: string) => {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  } catch (e) {}
};

addColumn('users', 'profile_pic', 'TEXT');
addColumn('users', 'social_links', 'TEXT');
addColumn('users', 'plain_password', 'TEXT');
addColumn('users', 'usage_period', "TEXT DEFAULT 'daily'");
addColumn('users', 'usage_limit', "INTEGER DEFAULT 5");
addColumn('users', 'initial_limit', "INTEGER DEFAULT 5");
db.exec("UPDATE users SET initial_limit = usage_limit WHERE initial_limit IS NULL OR initial_limit = 0;");
addColumn('scripts', 'inputs', 'TEXT');
addColumn('scripts', 'is_saved', 'INTEGER DEFAULT 0');
addColumn('scripts', 'video_link', 'TEXT');

// Migration: Ensure all users have an expiry date
db.exec("UPDATE users SET expires_at = '2099-12-31 23:59:59' WHERE expires_at IS NULL;");

// Hardcoded Manager Account
const managerEmail = 'abqareno@gmail.com';
const managerPass = 'Mena.H@56';
const existingManager = db.prepare('SELECT * FROM users WHERE email = ?').get(managerEmail);

if (!existingManager) {
  const hashedPassword = bcrypt.hashSync(managerPass, 10);
  db.prepare(`
    INSERT INTO users (name, username, email, phone, password, role, status, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('Manager', 'abqareno', managerEmail, '+201022049346', hashedPassword, 'manager', 'active', '2099-12-31 23:59:59');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'manager') {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }
  };

  // API Routes
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, username, email, phone, password } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Default 30 days
      
      const autoActivate: any = db.prepare("SELECT value FROM settings WHERE key = 'auto_activate'").get();
      const defaultClicks: any = db.prepare("SELECT value FROM settings WHERE key = 'default_clicks'").get();
      
      const status = autoActivate.value === '1' ? 'active' : 'pending';
      const usageLimit = parseInt(defaultClicks.value);

      const result = db.prepare(`
        INSERT INTO users (name, username, email, phone, password, plain_password, expires_at, status, usage_limit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, username, email, phone, hashedPassword, password, expiresAt.toISOString(), status, usageLimit);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { identifier, password } = req.body;
    const user: any = db.prepare(`
      SELECT * FROM users 
      WHERE email = ? OR phone = ? OR username = ?
    `).get(identifier, identifier, identifier);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ user: { id: user.id, name: user.name, username: user.username, role: user.role, status: user.status } });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
  });

  app.get('/api/auth/me', authenticate, (req: any, res) => {
    const user: any = db.prepare('SELECT id, name, username, email, phone, role, status, expires_at, usage_limit, usage_period, profile_pic, social_links, created_at FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  });

  app.get('/api/check-limits', authenticate, (req: any, res) => {
    const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (user.status === 'frozen') return res.status(403).json({ error: 'Account frozen' });
    if (user.status !== 'active') return res.status(403).json({ error: 'Account not active' });
    
    const now = new Date();
    if (new Date(user.expires_at) < now) return res.status(403).json({ error: 'Account expired' });

    if (user.usage_limit < 10) {
      return res.status(429).json({ error: 'Insufficient credits', limit: user.usage_limit });
    }

    res.json({ success: true, credits: user.usage_limit });
  });

  app.post('/api/auth/update-password', authenticate, (req: any, res) => {
    const { newPassword } = req.body;
    const user: any = db.prepare('SELECT status FROM users WHERE id = ?').get(req.user.id);
    if (user.status === 'frozen') return res.status(403).json({ error: 'Account frozen' });
    
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ?, plain_password = ? WHERE id = ?').run(hashedPassword, newPassword, req.user.id);
    res.json({ success: true });
  });

  // Script Routes
  app.post('/api/scripts', authenticate, (req: any, res) => {
    try {
      const { title, content, inputs } = req.body;
      
      // Check limits
      const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (user.status === 'frozen') return res.status(403).json({ error: 'Account frozen' });
      if (user.status !== 'active') return res.status(403).json({ error: 'Account not active' });
      
      const now = new Date();
      if (new Date(user.expires_at) < now) return res.status(403).json({ error: 'Account expired' });

      if (user.usage_limit < 10) {
        return res.status(429).json({ error: 'Insufficient credits', limit: user.usage_limit });
      }

      const result = db.prepare(`
        INSERT INTO scripts (user_id, title, inputs, content)
        VALUES (?, ?, ?, ?)
      `).run(req.user.id, title, JSON.stringify(inputs), JSON.stringify(content));

      // Decrement credits
      db.prepare('UPDATE users SET usage_limit = usage_limit - 10 WHERE id = ?').run(req.user.id);

      db.prepare(`
        INSERT INTO usage_logs (user_id, action)
        VALUES (?, 'generate_script')
      `).run(req.user.id);

      res.json({ success: true, id: result.lastInsertRowid, remainingCredits: user.usage_limit - 10 });
    } catch (err: any) {
      console.error('Error in /api/scripts:', err);
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  });

  app.get('/api/scripts', authenticate, (req: any, res) => {
    const scripts = db.prepare('SELECT * FROM scripts WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(scripts.map((s: any) => ({ ...s, content: JSON.parse(s.content), inputs: s.inputs ? JSON.parse(s.inputs) : null })));
  });

  app.post('/api/scripts/:id/save', authenticate, (req: any, res) => {
    const { is_saved } = req.body;
    db.prepare('UPDATE scripts SET is_saved = ? WHERE id = ? AND user_id = ?').run(is_saved ? 1 : 0, req.params.id, req.user.id);
    res.json({ success: true });
  });

  app.post('/api/scripts/:id/film', authenticate, (req: any, res) => {
    const { video_link } = req.body;
    db.prepare('UPDATE scripts SET video_link = ? WHERE id = ? AND user_id = ?').run(video_link, req.params.id, req.user.id);
    res.json({ success: true });
  });

  app.get('/api/scripts/filmed', authenticate, (req: any, res) => {
    const scripts = db.prepare('SELECT * FROM scripts WHERE user_id = ? AND video_link IS NOT NULL ORDER BY created_at DESC').all(req.user.id);
    res.json(scripts.map((s: any) => ({ ...s, content: JSON.parse(s.content), inputs: s.inputs ? JSON.parse(s.inputs) : null })));
  });

  app.get('/api/admin/filmed', authenticate, (req: any, res) => {
    if (req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
    const scripts = db.prepare(`
      SELECT s.*, u.name as user_name, u.phone as user_phone, u.email as user_email
      FROM scripts s
      JOIN users u ON s.user_id = u.id
      WHERE s.video_link IS NOT NULL
      ORDER BY s.created_at DESC
    `).all();
    res.json(scripts.map((s: any) => ({ ...s, content: JSON.parse(s.content), inputs: s.inputs ? JSON.parse(s.inputs) : null })));
  });

  app.get('/api/scripts/saved', authenticate, (req: any, res) => {
    const scripts = db.prepare('SELECT * FROM scripts WHERE user_id = ? AND is_saved = 1 ORDER BY created_at DESC').all(req.user.id);
    res.json(scripts.map((s: any) => ({ ...s, content: JSON.parse(s.content), inputs: s.inputs ? JSON.parse(s.inputs) : null })));
  });

  app.post('/api/suggestions', authenticate, (req: any, res) => {
    const { content, files, links } = req.body;
    const user: any = db.prepare('SELECT status FROM users WHERE id = ?').get(req.user.id);
    if (user.status === 'frozen') return res.status(403).json({ error: 'Account frozen' });

    db.prepare(`
      INSERT INTO suggestions (user_id, content, files, links)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, content, JSON.stringify(files || []), JSON.stringify(links || []));
    res.json({ success: true });
  });

  app.post('/api/user/profile', authenticate, (req: any, res) => {
    const { profile_pic, social_links } = req.body;
    const user: any = db.prepare('SELECT status FROM users WHERE id = ?').get(req.user.id);
    if (user.status === 'frozen') return res.status(403).json({ error: 'Account frozen' });

    db.prepare(`
      UPDATE users SET profile_pic = ?, social_links = ? WHERE id = ?
    `).run(profile_pic, JSON.stringify(social_links || {}), req.user.id);
    res.json({ success: true });
  });

  // Admin Routes
  app.get('/api/admin/users', authenticate, isAdmin, (req, res) => {
    const users = db.prepare('SELECT id, name, username, email, phone, password, plain_password, role, status, expires_at, usage_limit, usage_period, profile_pic, social_links, created_at FROM users').all();
    res.json(users);
  });

  app.get('/api/admin/settings', authenticate, isAdmin, (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsObj = settings.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  app.post('/api/admin/settings', authenticate, isAdmin, (req, res) => {
    const { auto_activate, default_clicks } = req.body;
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('auto_activate', ?)").run(auto_activate);
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('default_clicks', ?)").run(default_clicks);
    res.json({ success: true });
  });

  app.get('/api/admin/all-scripts', authenticate, isAdmin, (req, res) => {
    const scripts = db.prepare(`
      SELECT s.*, u.name as user_name, u.email as user_email 
      FROM scripts s 
      JOIN users u ON s.user_id = u.id 
      ORDER BY s.created_at DESC
    `).all();
    res.json(scripts.map((s: any) => ({ ...s, content: JSON.parse(s.content), inputs: s.inputs ? JSON.parse(s.inputs) : null })));
  });

  app.get('/api/admin/saved-scripts', authenticate, isAdmin, (req, res) => {
    const scripts = db.prepare(`
      SELECT s.*, u.name as user_name, u.email as user_email 
      FROM scripts s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.is_saved = 1
      ORDER BY s.created_at DESC
    `).all();
    res.json(scripts.map((s: any) => ({ ...s, content: JSON.parse(s.content), inputs: s.inputs ? JSON.parse(s.inputs) : null })));
  });

  app.get('/api/admin/suggestions', authenticate, isAdmin, (req, res) => {
    const suggestions = db.prepare(`
      SELECT s.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM suggestions s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `).all();
    res.json(suggestions.map((s: any) => ({ ...s, files: JSON.parse(s.files), links: JSON.parse(s.links) })));
  });

  app.get('/api/admin/stats', authenticate, isAdmin, (req, res) => {
    const totalScripts: any = db.prepare('SELECT COUNT(*) as count FROM scripts').get();
    const totalUsers: any = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const totalSuggestions: any = db.prepare('SELECT COUNT(*) as count FROM suggestions').get();
    const activeToday: any = db.prepare("SELECT COUNT(DISTINCT user_id) as count FROM scripts WHERE date(created_at) = date('now')").get();
    res.json({ totalScripts: totalScripts.count, totalUsers: totalUsers.count, totalSuggestions: totalSuggestions.count, activeToday: activeToday.count });
  });

  app.get('/api/admin/user/:id', authenticate, isAdmin, (req, res) => {
    const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    const scripts = db.prepare('SELECT * FROM scripts WHERE user_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json({ user, scripts: scripts.map((s: any) => ({ ...s, content: JSON.parse(s.content), inputs: s.inputs ? JSON.parse(s.inputs) : null })) });
  });

  app.post('/api/admin/user/:id/update', authenticate, isAdmin, (req, res) => {
    const { status, expires_at, usage_limit, initial_limit, usage_period, role } = req.body;
    db.prepare(`
      UPDATE users 
      SET status = ?, expires_at = ?, usage_limit = ?, initial_limit = ?, usage_period = ?, role = ?
      WHERE id = ?
    `).run(status, expires_at, usage_limit, initial_limit, usage_period, role, req.params.id);
    res.json({ success: true });
  });

  app.post('/api/admin/user/:id/subscription', authenticate, isAdmin, (req, res) => {
    const { credits, duration, initial_limit } = req.body;
    let expires_at = new Date();
    if (duration === 'weekly') expires_at.setDate(expires_at.getDate() + 7);
    else if (duration === 'monthly') expires_at.setDate(expires_at.getDate() + 30);
    else if (duration === 'yearly') expires_at.setDate(expires_at.getDate() + 365);
    
    const expires_at_str = expires_at.toISOString().slice(0, 19).replace('T', ' ');

    db.prepare(`
      UPDATE users 
      SET usage_limit = ?, initial_limit = ?, expires_at = ?, status = 'active'
      WHERE id = ?
    `).run(credits, initial_limit, expires_at_str, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/admin/user/:id', authenticate, isAdmin, (req, res) => {
    db.prepare('DELETE FROM scripts WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM usage_logs WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/site-config', (req, res) => {
    const config: any = db.prepare("SELECT value FROM settings WHERE key = 'site_config'").get();
    res.json(JSON.parse(config.value || '{}'));
  });

  app.post('/api/admin/site-config', authenticate, isAdmin, (req, res) => {
    const config = req.body;
    db.prepare("UPDATE settings SET value = ? WHERE key = 'site_config'").run(JSON.stringify(config));
    res.json({ success: true });
  });

  app.post('/api/admin/upload-image', authenticate, isAdmin, (req, res) => {
    const { image, filename } = req.body; // image is base64
    // In a real app, we'd save to disk. For simplicity in this environment, 
    // we'll return the base64 or a mock URL if we had a public folder.
    // Since we want "real", let's try to save to a public folder if we can.
    // But base64 is safer for this specific sandbox to ensure it works in the preview.
    // I'll stick to returning the base64 for now as "uploaded" data.
    res.json({ url: image }); 
  });

  // Error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Server Error:', err);
    res.status(err.status || 500).json({ 
      error: 'Internal Server Error', 
      message: err.message || 'حدث خطأ غير متوقع في الخادم' 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
