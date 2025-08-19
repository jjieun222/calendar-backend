import express from "express";
import pg from "pg";

const app = express();
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());

// --- DB 초기화 ---
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS calendars (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      calendar_id INT REFERENCES calendars(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      start_date DATE NOT NULL
    );
  `);

  console.log("✅ Tables ensured (calendars, events)");
}
initDB();

// --- API 라우트 ---
// 1. 캘린더 생성
app.post("/api/calendars", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });

  try {
    const result = await pool.query(
      "INSERT INTO calendars (name) VALUES ($1) RETURNING *",
      [name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: "Calendar already exists or invalid" });
  }
});

// 2. 캘린더 조회
app.get("/api/calendars/:name", async (req, res) => {
  const { name } = req.params;
  const result = await pool.query(
    "SELECT * FROM calendars WHERE name=$1",
    [name]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Calendar not found" });
  }
  res.json(result.rows[0]);
});

// 3. 이벤트 추가
app.post("/api/calendars/:name/events", async (req, res) => {
  const { name } = req.params;
  const { title, start_date } = req.body;

  try {
    const cal = await pool.query("SELECT * FROM calendars WHERE name=$1", [name]);
    if (cal.rows.length === 0) {
      return res.status(404).json({ error: "Calendar not found" });
    }
    const calendar_id = cal.rows[0].id;

    const result = await pool.query(
      "INSERT INTO events (calendar_id, title, start_date) VALUES ($1, $2, $3) RETURNING *",
      [calendar_id, title, start_date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: "Failed to add event" });
  }
});

// 4. 이벤트 조회
app.get("/api/calendars/:name/events", async (req, res) => {
  const { name } = req.params;

  const cal = await pool.query("SELECT * FROM calendars WHERE name=$1", [name]);
  if (cal.rows.length === 0) {
    return res.status(404).json({ error: "Calendar not found" });
  }
  const calendar_id = cal.rows[0].id;

  const events = await pool.query(
    "SELECT * FROM events WHERE calendar_id=$1 ORDER BY start_date ASC",
    [calendar_id]
  );
  res.json(events.rows);
});

// --- 기본 페이지 ---
app.get("/", (req, res) => {
  res.send("📅 Calendar backend is running!");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server started");
});
