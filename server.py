import os
import psycopg2
from flask import Flask, request, jsonify

app = Flask(__name__)
DATABASE_URL = os.environ.get("DATABASE_URL")

@app.route("/calendars/<name>", methods=["GET"])
def get_calendar(name):
    conn = psycopg2.connect(DATABASE_URL, sslmode="require")
    cur = conn.cursor()
    cur.execute("SELECT id FROM calendars WHERE name=%s", (name,))
    cal = cur.fetchone()
    if not cal:
        return jsonify({"error": "not_found"}), 404
    cal_id = cal[0]
    cur.execute("SELECT title, date FROM events WHERE calendar_id=%s ORDER BY date", (cal_id,))
    events = [{"title": row[0], "date": row[1].isoformat()} for row in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(events)

@app.route("/calendars/<name>/events", methods=["POST"])
def add_event(name):
    data = request.json
    title = data.get("title")
    date = data.get("date")

    conn = psycopg2.connect(DATABASE_URL, sslmode="require")
    cur = conn.cursor()
    cur.execute("SELECT id FROM calendars WHERE name=%s", (name,))
    cal = cur.fetchone()
    if not cal:
        return jsonify({"error": "not_found"}), 404
    cal_id = cal[0]
    cur.execute("INSERT INTO events (calendar_id, title, date) VALUES (%s, %s, %s)",
                (cal_id, title, date))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
