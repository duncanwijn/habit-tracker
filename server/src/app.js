import Database from 'better-sqlite3'
import 'dotenv/config'; //  Works perfectly in ES Modules
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';


const db = new Database('users.db');
db.prepare('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, passwordHash TEXT)').run();
db.prepare('CREATE TABLE IF NOT EXISTS completions (id INTEGER PRIMARY KEY AUTOINCREMENT, habitId INTEGER, lastCompletionDate TEXT, streak INTEGER, FOREIGN KEY(habitId) REFERENCES habits(id))').run();
db.prepare('CREATE TABLE IF NOT EXISTS habits (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, userId INTEGER, freq TEXT, FOREIGN KEY(userId) REFERENCES users(id))').run();

const app = express();
app.use(express.json());

// Allow requests from the Vite dev server
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Access your secure secret key
const JWT_SECRET = process.env.JWT_TOKEN_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}

app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;

  // Hash the password before storing it
  const passwordHash = await bcrypt.hash(password, 10);

  // Store user in the database
  db.prepare('INSERT INTO users (username, email, passwordHash) VALUES (?, ?, ?)')
    .run(username, email, passwordHash);
  
  res.status(201).json({ message: 'User registered successfully!' });
});

// 2. Authentication Route (The Login Phase)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // Verify username
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  // Verify password using bcrypt
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  // Generate JWT if credentials are correct
  const token = jwt.sign(
    { userId: user.id, username: user.username }, // Payload data
    JWT_SECRET,                                   // Secret Key
    { expiresIn: '1h' }                           // Token expiration config
  );

  // Return token and user to the client
  return res.json({ message: 'Login successful!', token, user: { id: user.id, username: user.username, email: user.email } });
});

//3. Fetch user from saved token (optional, for session persistence)
app.get('/api/user', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const decoded = jwt.verify(token, JWT_SECRET);
  const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(decoded.userId);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  
  return res.json({ user });

});

app.delete('/api/habits/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM habits WHERE id = ? AND userId = ?').run(id, req.user.userId);
  db.prepare('DELETE FROM completions WHERE habitId = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ message: 'Habit not found.' });
  }

  return res.json({ message: 'Habit deleted successfully.' });
});
app.post('/api/habits/:id/complete', authenticateToken, (req, res) => {
  const { id } = req.params;
  const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND userId = ?').get(id, req.user.userId);
  
  if (!habit) {
    return res.status(404).json({ message: 'Habit not found.' });
  }
  
  // Update the habit's completion status and streak
  const newStreak = habit.completed ? habit.streak : habit.streak + 1;
  db.prepare('UPDATE completions SET lastCompletionDate = ?, streak = ? WHERE habitId = ?')
    .run(new Date().toISOString(), newStreak, id);

  return res.json({ message: 'Habit completion status updated successfully.' });
});

app.get('/api/habits/:id/streak', authenticateToken, (req, res) => {
  const { id } = req.params;
  const completion = db.prepare('SELECT streak FROM completions WHERE habitId = ?').get(id);
  
  if (!completion) {
    db.prepare('INSERT INTO completions (habitId, lastCompletionDate, streak) VALUES (?, ?, ?)').run(id, new Date().toISOString(), 0);
    return res.json({ streak: 0 });
  }

  res.json({ streak: completion.streak });
});

app.post('/api/create/habit', authenticateToken, (req, res) => {
  const { name, freq } = req.body;
  const result = db.prepare('INSERT INTO habits (name, userId, completed, freq) VALUES (?, ?, ?, ?)').run(name, req.user.userId, false, freq);
  if (result.changes === 0) {
    return res.status(500).json({ message: 'Failed to create habit.' });
  }
  db.prepare('INSERT INTO completions (habitId, lastCompletionDate, streak) VALUES (?, ?, ?)').run(result.lastInsertRowid, new Date().toISOString(), 0);
  return res.status(201).json({ message: 'Habit created successfully!', habitId: result.lastInsertRowid });
});

app.post('/api/update/habit/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, freq } = req.body;
  
  const result = db.prepare('UPDATE habits SET name = ?, freq = ? WHERE id = ? AND userId = ?')
    .run(name, freq, id, req.user.userId);
  
  if (result.changes === 0) {
    return res.status(404).json({ message: 'Habit not found or no changes made.' });
  }

  return res.json({ message: 'Habit updated successfully.' });
});

// 3. Authorization Middleware (The Interceptor Phase)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  // Format should be: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // Verify signature and checking expiration
  jwt.verify(token, JWT_SECRET, (err, userPayload) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }

    // Attach decoded user data to the request object for use in downstream routes
    req.user = userPayload; 
    next();
  });
}

app.get('/api/habits/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND userId = ?').get(id, req.user.userId);
  
  if (!habit) {
    return res.status(404).json({ message: 'Habit not found.' });
  }

  res.json({ habit });
});

app.get('/api/:user_id/habits/', authenticateToken, (req, res) => {
  const { user_id } = req.params;
  const habits = db.prepare('SELECT * FROM habits WHERE userId = ?').all(user_id);
  res.json({ habits });
});

// 4. Protected Route (The Authorization Phase)
app.get('/api/dashboard', authenticateToken, (req, res) => {
  // Access data appended by our middleware
  res.json({
    message: 'Welcome to the protected dashboard!',
    secretData: 'The falcon flies at midnight.',
    user: req.user
  });
});

// Start Server
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
