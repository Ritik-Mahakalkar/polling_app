const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());


const db = mysql.createPool({
  host: process.env.DB_HOST ,
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD ,
  database: process.env.DB_NAME ,
}).promise( console.log("database connected"));

// CREATE POLL
app.post("/polls", async (req, res) => {
  const { question, options, created_by } = req.body;
  if (!question || !Array.isArray(options) || options.length < 2 || options.length > 5) {
    return res.status(400).json({ error: "Invalid poll data" });
  }

  try {
    const [pollResult] = await db.execute(
      "INSERT INTO polls (question, created_by, created_at) VALUES (?, ?, NOW())",
      [question, created_by]
    );

    const pollId = pollResult.insertId;
    for (const option of options) {
      await db.execute(
        "INSERT INTO poll_options (poll_id, option_text) VALUES (?, ?)",
        [pollId, option]
      );
    }

    res.status(201).json({ message: "Poll created", pollId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL POLLS
app.get("/polls", async (req, res) => {
  try {
    const [polls] = await db.execute("SELECT * FROM polls ORDER BY created_at DESC");
    res.json(polls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET POLL 
app.get("/polls/:id", async (req, res) => {
  const pollId = req.params.id;
  try {
    const [poll] = await db.execute("SELECT * FROM polls WHERE id = ?", [pollId]);
    const [options] = await db.execute("SELECT * FROM poll_options WHERE poll_id = ?", [pollId]);
    res.json({ poll: poll[0], options });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vote
app.post("/polls/:id/vote", async (req, res) => {
  const pollId = req.params.id;
  const { user_id, option_id } = req.body;

  try {
    await db.execute(
      "INSERT INTO poll_votes (user_id, poll_id, option_id, voted_at) VALUES (?, ?, ?, NOW())",
      [user_id, pollId, option_id]
    );
    await db.execute(
      "UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = ?",
      [option_id]
    );
    res.json({ message: "Vote recorded" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET RESULTS
app.get("/polls/:id/results", async (req, res) => {
  const pollId = req.params.id;
  try {
    const [results] = await db.execute(
      "SELECT option_text, vote_count FROM poll_options WHERE poll_id = ?",
      [pollId]
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
