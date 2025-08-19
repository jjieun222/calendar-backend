const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const calendarRoutes = require("./routes/calendar")(pool);
app.use("/calendar", calendarRoutes);

app.get("/", (req, res) => {
  res.send("📅 Calendar Backend Running");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
