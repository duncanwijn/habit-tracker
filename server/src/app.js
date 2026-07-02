import Database from 'better-sqlite3'
import 'dotenv/config'; //  Works perfectly in ES Modules
import express, { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';


const db = new Database(process.env.DB_PATH || 'users.db');

const getLogicalDate = (cutoffHours = 4) => {
  const now = new Date();
  
  // If it's before 4 AM, shift our tracking back by 4 hours
  // Create a shifted date object
  const shiftedDate = new Date(now.getTime() - (cutoffHours * 60 * 60 * 1000));
  
  // Format as YYYY-MM-DD using local time
  const year = shiftedDate.getFullYear();
  const month = String(shiftedDate.getMonth() + 1).padStart(2, '0');
  const day = String(shiftedDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}


db.prepare('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, passwordHash TEXT)').run();
db.prepare('CREATE TABLE IF NOT EXISTS completions (id INTEGER PRIMARY KEY AUTOINCREMENT, habitId INTEGER, date TEXT, amount INTEGER, logged_at TEXT, FOREIGN KEY(habitId) REFERENCES habits(id))').run();
db.prepare('CREATE TABLE IF NOT EXISTS habits (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, userId INTEGER, created TEXT, freq TEXT, streak INTEGER, completed INTEGER DEFAULT 0, amount INTEGER DEFAULT 1, icon TEXT, type TEXT, customUnit TEXT, FOREIGN KEY(userId) REFERENCES users(id))').run();

const app = express();
app.use(express.json());

if (!process.env.CLIENT_ORIGIN) {
  console.error("FATAL ERROR: CLIENT_ORIGIN is not defined.");
  process.exit(1);
}
const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

if (ALLOWED_ORIGINS.length != 2) {
  console.error("FATAL ERROR: CLIENT_ORIGIN must contain exactly two origins separated by a comma.");
  process.exit(1);
}
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
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

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }

  const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(decoded.userId);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  
  return res.json({ user });

});

app.delete('/api/habits/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM completions WHERE habitId = ?').run(id);
  const result = db.prepare('DELETE FROM habits WHERE id = ? AND userId = ?').run(id, req.user.userId);
  if (result.changes === 0) {
    return res.status(404).json({ message: 'Habit not found.' });
  }

  return res.json({ message: 'Habit deleted successfully.' });
});
app.post('/api/habits/:id/complete', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { timezone } = req.body;
  const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND userId = ?').get(id, req.user.userId);
  
  if (!habit) {
    return res.status(404).json({ message: 'Habit not found.' });
  }

  const freq = habit.freq ?? 'daily';
  
  let completion = db.prepare('SELECT date FROM completions WHERE habitId = ? ORDER BY id DESC LIMIT 1').get(id);
  if (!completion) {
    completion = { date: null, streak: 0 };
  }

  let todayStr;
  if (timezone) {
    try {
      todayStr = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
    } catch {
      todayStr = getLogicalDate();
    }
  } else {
    todayStr = getLogicalDate();
  }
  const today = new Date(todayStr);
  const { date: lastCompletionDate } = completion;
  if (!lastCompletionDate) {
    console.log(`No previous completion found for habit ID ${id}. Marking as completed for today.`);
    db.prepare('UPDATE habits SET streak = 1, completed = 1 WHERE id = ?').run(id);
    db.prepare('INSERT INTO completions (habitId, date, logged_at) VALUES (?, ?, ?)').run(id, todayStr, new Date().toISOString());
    return res.json({ message: 'Habit completed successfully.' });
  } else {
    const lastDate = new Date(lastCompletionDate);
    if (freq === 'daily') {
      if (lastDate.toDateString() === today.toDateString()) {
        console.log(`Habit ID ${id} already completed today. Last completion date: ${lastCompletionDate}`);
        db.prepare('UPDATE habits SET completed = 1 WHERE id = ?').run(id);
        return res.json({ message: 'Habit already completed today.' });
      }
      if (lastDate < new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)) {
        db.prepare('UPDATE habits SET streak = 1, completed = 1 WHERE id = ?').run(id);
        db.prepare('INSERT INTO completions (habitId, date, logged_at) VALUES (?, ?, ?)').run(id, todayStr, new Date().toISOString());
        return res.json({ message: 'Habit completed successfully.' });
      }
      db.prepare('UPDATE habits SET streak = streak + 1 WHERE id = ?').run(id);
    }
    if (freq === 'weekly') {
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      if (lastDate > lastWeek) {
        db.prepare('UPDATE habits SET completed = 1 WHERE id = ?').run(id);
        return res.json({ message: 'Habit already completed this week.' });
      }
      const twoWeeksAgo = new Date(today);
      twoWeeksAgo.setDate(today.getDate() - 14);
      if (lastDate < twoWeeksAgo) {
        db.prepare('UPDATE habits SET streak = 1, completed = 1 WHERE id = ?').run(id);
        db.prepare('INSERT INTO completions (habitId, date, logged_at) VALUES (?, ?, ?)').run(id, todayStr, new Date().toISOString());
        return res.json({ message: 'Habit completed successfully.' });
      }
      db.prepare('UPDATE habits SET streak = streak + 1 WHERE id = ?').run(id);
    }

  }

  db.prepare('INSERT INTO completions (habitId, date, logged_at) VALUES (?, ?, ?)').run(id, todayStr, new Date().toISOString());
  db.prepare('UPDATE habits SET completed = 1 WHERE id = ?').run(id);


  const streak = db.prepare('SELECT completed FROM habits WHERE id = ?').get(id);
  console.log(`Habit ID ${id} completed. Current streak: ${streak.completed}`);
  return res.json({ message: 'Habit completed successfully.', streak: streak.completed });
});

app.post('/api/habits/:id/uncomplete', authenticateToken, (req, res) => {
  const { id } = req.params;
  const result = db.prepare('UPDATE habits SET completed = 0 WHERE id = ? AND userId = ?').run(id, req.user.userId);
  if (result.changes === 0) {
    return res.status(404).json({ message: 'Habit not found.' });
  }
  return res.json({ message: 'Habit marked incomplete.' });
});

app.get('/api/habits/:id/streak', authenticateToken, (req, res) => {
  const { id } = req.params;
  const completion = db.prepare('SELECT date FROM completions WHERE habitId = ? ORDER BY id DESC LIMIT 1').get(id);
  if (!completion) {
    return res.json({ streak: 0, lastCompletionDate: null });
  }
  const habit = db.prepare('SELECT streak FROM habits WHERE id = ?').get(id);
  console.log(`Fetched streak for habit ID ${id}: ${habit.streak}, Last completion date: ${completion.date}`);
  res.json({ streak: habit.streak, lastCompletionDate: completion.date });
});

app.post('/api/create/habit', authenticateToken, (req, res) => {
  const { name, freq, icon, amount, type, customUnit } = req.body;
  console.log(`Creating habit for user ${req.user.userId}:`, { name, freq, icon, amount, type, customUnit });
  const result = db.prepare('INSERT INTO habits (name, userId, created, completed, freq, icon, amount, type, customUnit, streak) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)')
    .run(name, req.user.userId, new Date().toISOString(), 0, freq ?? 'daily', icon ?? '', amount ?? 1, type ?? 'count', customUnit ?? '');
  if (result.changes === 0) {
    return res.status(500).json({ message: 'Failed to create habit.' });
  }
  return res.status(201).json({ message: 'Habit created successfully!', habitId: result.lastInsertRowid });
});

app.post('/api/update/habit/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, freq, icon, amount, type, customUnit } = req.body;
  
  const result = db.prepare('UPDATE habits SET name = ?, freq = ?, icon = ?, amount = ?, type = ?, customUnit = ? WHERE id = ? AND userId = ?')
    .run(name, freq, icon ?? '', amount ?? 1, type ?? 'count', customUnit ?? '', id, req.user.userId);
  
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
app.get('/api/calendar-view', authenticateToken, (req, res) => {
  // Access data appended by our middleware
  const habits = db.prepare('SELECT id, name, freq, created FROM habits WHERE userId = ?').all(req.user.userId);
  const habitsWithCompletions = habits.map(({ id, name, freq, created }) => {
    const completions = db.prepare('SELECT date FROM completions WHERE habitId = ?').all(id);
    return { id, name, freq, created, completions };
  });
  
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonthCount = new Date(year, month + 1, 0).getDate();

  const daysInMonth = {};
  for (let day = 1; day <= daysInMonthCount; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    daysInMonth[dateStr] = { completed: 0, active: habits.length };
  }

  habitsWithCompletions.map(habit => {
    habit.completions.forEach(c => {
      if (daysInMonth[c.date]) {
        daysInMonth[c.date].completed += 1;
      }
    });
  });
  
  Object.keys(daysInMonth).forEach(day => {
    const { completed, active } = daysInMonth[day];
    daysInMonth[day].completionRate = active > 0 ? (completed / active) : 0;
  });
  return res.json({ monthData: daysInMonth });
});

app.get('/api/heatmap-data', authenticateToken, (req, res) => {

  const { timeframe, freq } = req.query;

  // Access data appended by our middleware
  const habits = db.prepare('SELECT id, name, freq, created FROM habits WHERE userId = ?').all(req.user.userId);
  const habitsWithCompletions = habits.map(({ id, name, freq, created }) => {
    const completions = db.prepare('SELECT date FROM completions WHERE habitId = ?').all(id);
    return { id, name, freq, created, completions };
  });
  
  let start = new Date();
  let end = new Date();
  const now = new Date();
  if (timeframe === "year") {
    start.setDate(start.getDate() - (52 - 1) * 7);
  } else if (timeframe === "month") {
    start.setDate(1); // Set to the first day of the current month
    start = new Date(start.getFullYear(), start.getMonth(), start.getDate() - start.getDay());
    end = new Date(start.getFullYear(), start.getMonth() + 1, 0); 
    end.setDate(end.getDate() + (6 - end.getDay()));
  } else if (timeframe === "week") {
    start.setDate(start.getDate() - start.getDay());
  }
  const daysCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1; // +1 to include the last day
  const daysData = {};
  for (let day = start; day <= end; day.setDate(day.getDate() + 1)) {
    const dateStr = day.toISOString().split('T')[0];
    daysData[dateStr] = { completed: 0, active: habits.length };
  }

  habitsWithCompletions.map(habit => {
    habit.completions.forEach(c => {
      if (daysData[c.date]) {
        daysData[c.date].completed += 1;
      }
    });
  });
  
  Object.keys(daysData).forEach(day => {
    const { completed, active } = daysData[day];
    daysData[day].completionRate = active > 0 ? (completed / active) : 0;
  });
  return res.json({ monthData: daysData });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
