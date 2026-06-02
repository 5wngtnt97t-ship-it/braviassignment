const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'bravin-morara-secret-key-2026';

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize SQLite database
const db = new sqlite3.Database('bravin-morara.db');

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    service_type TEXT,
    paper_type TEXT,
    academic_level TEXT,
    deadline TEXT,
    word_count INTEGER,
    price REAL,
    details TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Admin middleware (simple check - in production use proper role-based auth)
const adminAuth = (req, res, next) => {
  const token = req.headers['x-admin-key'];
  if (token === 'bravin-admin-2026') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Routes - Authentication

// Register
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  db.run(
    `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
    [name, email, hashedPassword],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      res.json({ message: 'User created successfully', userId: this.lastID });
    }
  );
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  });
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
  db.get(`SELECT id, name, email, created_at FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});

// Orders

// Create order
app.post('/api/orders', authenticateToken, (req, res) => {
  const { serviceType, paperType, academicLevel, deadline, wordCount, price, details } = req.body;
  
  db.run(
    `INSERT INTO orders (user_id, service_type, paper_type, academic_level, deadline, word_count, price, details) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, serviceType, paperType, academicLevel, deadline, wordCount, price, details],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: 'Order created', orderId: this.lastID });
    }
  );
});

// Get user orders
app.get('/api/orders', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id], (err, orders) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(orders);
  });
});

// Price calculation endpoint
app.post('/api/calculate-price', (req, res) => {
  const { serviceType, academicLevel, deadline, wordCount } = req.body;
  
  // Base price $13.50 per 250 words (20% reduction)
  let basePrice = 13.50 / 250;
  
  // Academic level multipliers
  const levelMultipliers = { undergraduate: 1, masters: 1.3, phd: 1.6 };
  basePrice *= (levelMultipliers[academicLevel] || 1);
  
  // Deadline multipliers
  const deadlineMultipliers = { 3: 2.5, 6: 2, 12: 1.8, 24: 1.5, 48: 1.3, 7days: 1.1 };
  basePrice *= (deadlineMultipliers[deadline] || 1);
  
  const price = parseFloat((wordCount * basePrice).toFixed(2));
  res.json({ price });
});

// Admin endpoints
app.get('/api/admin/users', adminAuth, (req, res) => {
  db.all(`SELECT id, name, email, created_at FROM users`, (err, users) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(users);
  });
});

app.get('/api/admin/orders', adminAuth, (req, res) => {
  db.all(`SELECT o.*, u.name, u.email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC`, (err, orders) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(orders);
  });
});

app.get('/api/admin/stats', adminAuth, (req, res) => {
  db.get(`SELECT COUNT(*) as userCount FROM users`, (err, userStats) => {
    if (err) return res.status(400).json({ error: err.message });
    
    db.get(`SELECT COUNT(*) as orderCount, SUM(price) as totalRevenue FROM orders`, (err, orderStats) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json({
        users: userStats.userCount,
        orders: orderStats.orderCount,
        revenue: orderStats.totalRevenue || 0
      });
    });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bravin Morara API running' });
});

// Admin dashboard HTML
app.get('/admin', (req, res) => {
  res.sendFile('admin.html', { root: __dirname });
});

// Serve static files
app.use(express.static('public'));

// Start server
app.listen(PORT, () => {
  console.log(`Bravin Morara backend running on port ${PORT}`);
});