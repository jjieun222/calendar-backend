const express = require("express");

module.exports = (pool) => {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM calendars ORDER BY id");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/", async (req, res) => {
    const { name } = req.body;
    try {
      const result = await pool.query(
        "INSERT INTO calendars (name) VALUES ($1) RETURNING *",
        [name]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/:id/events", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        "SELECT * FROM events WHERE calendar_id = $1 ORDER BY start_date",
        [id]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/:id/events", async (req, res) => {
    const { id } = req.params;
    const { title, start_date } = req.body;
    try {
      const result = await pool.query(
        "INSERT INTO events (calendar_id, title, start_date) VALUES ($1,$2,$3) RETURNING *",
        [id, title, start_date]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
