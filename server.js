import express from "express";
import pg from "pg";

const app = express();
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());

// --- DB 초기화 코드 ---
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
// ----------------------

// 테스트용 엔드포인트
app.get("/", (req, res) => {
  res.send("Calendar backend is running!");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server started");
});
