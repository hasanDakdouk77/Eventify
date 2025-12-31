require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql");

const app = express();

const PORT = Number(process.env.PORT || 8080);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "eventify",
  port: Number(process.env.DB_PORT || 3306),
  connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
  multipleStatements: false,

  dateStrings: true,
};

app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN,
    credentials: true,
  })
);

const pool = mysql.createPool(dbConfig);

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

function normalizeEvent(row) {
  return {
    id: Number(row.id),
    title: row.title,
    date: row.date,
    time: row.time ?? null,
    category_id:
      row.category_id === null || row.category_id === undefined
        ? null
        : Number(row.category_id),
    category: row.category ?? null,
    priority: row.priority,
    notes: row.notes ?? null,
    done: Boolean(row.done),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function getCategoryIdFromBody(body) {
  if (
    body.category_id !== undefined &&
    body.category_id !== null &&
    body.category_id !== ""
  ) {
    const n = Number(body.category_id);
    if (!Number.isFinite(n)) throw new Error("category_id must be a number");
    return n;
  }

  if (isNonEmptyString(body.category)) {
    const name = body.category.trim();

    const rows = await query("SELECT id FROM categories WHERE name=? LIMIT 1", [
      name,
    ]);
    if (rows.length) return Number(rows[0].id);

    const result = await query(
      "INSERT INTO categories (name, description) VALUES (?, NULL)",
      [name]
    );
    return Number(result.insertId);
  }

  return null;
}

async function fetchEventById(id) {
  const rows = await query(
    `
    SELECT
      e.id, e.title, e.date, e.time, e.category_id, e.priority, e.notes, e.done,
      e.created_at, e.updated_at,
      c.name AS category
    FROM events e
    LEFT JOIN categories c ON c.id = e.category_id
    WHERE e.id=?
    LIMIT 1
    `,
    [id]
  );
  return rows.length ? normalizeEvent(rows[0]) : null;
}

app.get("/api/health", async (req, res) => {
  try {
    await query("SELECT 1");
    res.json({ ok: true, db: "connected" });
  } catch (err) {
    res.status(500).json({ ok: false, db: "disconnected", error: err.message });
  }
});

app.get("/api/categories", async (req, res, next) => {
  try {
    const rows = await query(
      "SELECT id, name, description, created_at FROM categories ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

app.get("/api/categories/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const rows = await query(
      "SELECT id, name, description, created_at FROM categories WHERE id=?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Category not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

app.post("/api/categories", async (req, res, next) => {
  try {
    const { name, description = null } = req.body;
    if (!isNonEmptyString(name))
      return res.status(400).json({ error: "name is required" });

    const result = await query(
      "INSERT INTO categories (name, description) VALUES (?, ?)",
      [name.trim(), description]
    );

    res
      .status(201)
      .json({ id: Number(result.insertId), name: name.trim(), description });
  } catch (err) {
    next(err);
  }
});

app.put("/api/categories/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, description = null } = req.body;

    if (!isNonEmptyString(name))
      return res.status(400).json({ error: "name is required" });

    const result = await query(
      "UPDATE categories SET name=?, description=? WHERE id=?",
      [name.trim(), description, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Category not found" });
    res.json({ id, name: name.trim(), description });
  } catch (err) {
    next(err);
  }
});

app.delete("/api/categories/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const used = await query(
      "SELECT COUNT(*) AS c FROM events WHERE category_id=?",
      [id]
    );
    if (used[0]?.c > 0) {
      return res
        .status(409)
        .json({ error: "Cannot delete category: it is used by events" });
    }

    const result = await query("DELETE FROM categories WHERE id=?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Category not found" });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.get("/api/events", async (req, res, next) => {
  try {
    const { done, category_id, dateFrom, dateTo, q: search } = req.query;

    const where = [];
    const params = [];

    if (done === "0" || done === "1") {
      where.push("e.done = ?");
      params.push(Number(done));
    }
    if (
      category_id !== undefined &&
      category_id !== null &&
      category_id !== ""
    ) {
      where.push("e.category_id = ?");
      params.push(Number(category_id));
    }
    if (dateFrom) {
      where.push("e.date >= ?");
      params.push(String(dateFrom));
    }
    if (dateTo) {
      where.push("e.date <= ?");
      params.push(String(dateTo));
    }
    if (search && String(search).trim()) {
      where.push("(e.title LIKE ? OR e.notes LIKE ?)");
      const s = `%${String(search).trim()}%`;
      params.push(s, s);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const rows = await query(
      `
      SELECT
        e.id, e.title, e.date, e.time, e.category_id, e.priority, e.notes, e.done,
        e.created_at, e.updated_at,
        c.name AS category
      FROM events e
      LEFT JOIN categories c ON c.id = e.category_id
      ${whereSql}
      ORDER BY e.date ASC, e.time ASC, e.id DESC
      `,
      params
    );

    res.json(rows.map(normalizeEvent));
  } catch (err) {
    next(err);
  }
});

app.get("/api/events/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const ev = await fetchEventById(id);
    if (!ev) return res.status(404).json({ error: "Event not found" });
    res.json(ev);
  } catch (err) {
    next(err);
  }
});

app.post("/api/events", async (req, res, next) => {
  try {
    const {
      title,
      date,
      time = null,
      priority = "Medium",
      notes = null,
    } = req.body;

    if (!isNonEmptyString(title))
      return res.status(400).json({ error: "title is required" });
    if (!isNonEmptyString(date))
      return res.status(400).json({ error: "date is required (YYYY-MM-DD)" });
    if (!["Low", "Medium", "High"].includes(priority)) {
      return res
        .status(400)
        .json({ error: "priority must be Low, Medium, or High" });
    }

    const categoryId = await getCategoryIdFromBody(req.body);
    const cleanTime = isNonEmptyString(time) ? time : null;

    const result = await query(
      "INSERT INTO events (title, date, time, category_id, priority, notes, done) VALUES (?, ?, ?, ?, ?, ?, 0)",
      [title.trim(), date.trim(), cleanTime, categoryId, priority, notes]
    );

    const created = await fetchEventById(Number(result.insertId));
    res.status(201).json(created);
  } catch (err) {
    if (String(err?.message || "").includes("category_id")) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

app.patch("/api/events/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const allowed = [
      "title",
      "date",
      "time",
      "category",
      "category_id",
      "priority",
      "notes",
      "done",
    ];
    const bodyKeys = Object.keys(req.body || {});

    const hasAnyAllowed = bodyKeys.some((k) => allowed.includes(k));
    if (!hasAnyAllowed)
      return res.status(400).json({ error: "No valid fields to update" });

    const sets = [];
    const params = [];

    if (req.body.title !== undefined) {
      if (!isNonEmptyString(req.body.title))
        return res
          .status(400)
          .json({ error: "title must be a non-empty string" });
      sets.push("title=?");
      params.push(req.body.title.trim());
    }

    if (req.body.date !== undefined) {
      if (!isNonEmptyString(req.body.date))
        return res
          .status(400)
          .json({ error: "date must be a non-empty string (YYYY-MM-DD)" });
      sets.push("date=?");
      params.push(req.body.date.trim());
    }

    if (req.body.time !== undefined) {
      const t = req.body.time;
      if (t === null || t === "") {
        sets.push("time=?");
        params.push(null);
      } else if (isNonEmptyString(t)) {
        sets.push("time=?");
        params.push(t);
      } else {
        return res
          .status(400)
          .json({ error: "time must be a string (HH:MM) or null" });
      }
    }

    if (req.body.priority !== undefined) {
      if (!["Low", "Medium", "High"].includes(req.body.priority)) {
        return res
          .status(400)
          .json({ error: "priority must be Low, Medium, or High" });
      }
      sets.push("priority=?");
      params.push(req.body.priority);
    }

    if (req.body.notes !== undefined) {
      sets.push("notes=?");
      params.push(req.body.notes === "" ? null : req.body.notes);
    }

    if (req.body.done !== undefined) {
      const d = req.body.done;
      const valid =
        d === 0 ||
        d === 1 ||
        d === "0" ||
        d === "1" ||
        d === true ||
        d === false;
      if (!valid)
        return res
          .status(400)
          .json({ error: "done must be 0/1 or true/false" });
      sets.push("done=?");
      params.push(Number(d) ? 1 : 0);
    }

    if (req.body.category !== undefined || req.body.category_id !== undefined) {
      const categoryId = await getCategoryIdFromBody(req.body);
      sets.push("category_id=?");
      params.push(categoryId);
    }

    if (sets.length === 0)
      return res.status(400).json({ error: "No valid fields to update" });

    params.push(id);
    const result = await query(
      `UPDATE events SET ${sets.join(", ")} WHERE id=?`,
      params
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Event not found" });

    const updated = await fetchEventById(id);
    res.json(updated);
  } catch (err) {
    if (String(err?.message || "").includes("category_id")) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

app.patch("/api/events/:id/done", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { done } = req.body;

    const valid =
      done === 0 ||
      done === 1 ||
      done === "0" ||
      done === "1" ||
      done === true ||
      done === false;
    if (!valid)
      return res.status(400).json({ error: "done must be 0/1 or true/false" });

    const result = await query("UPDATE events SET done=? WHERE id=?", [
      Number(done) ? 1 : 0,
      id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Event not found" });

    const updated = await fetchEventById(id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

app.delete("/api/events/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const result = await query("DELETE FROM events WHERE id=?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Event not found" });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error("API Error:", err);

  const msg = err?.message || "Server error";

  res.status(500).json({ error: msg });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  console.log(`CORS origin allowed: ${CORS_ORIGIN}`);
});
