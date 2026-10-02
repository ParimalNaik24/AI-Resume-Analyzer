const express = require('express');
const pool = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

const FIELDS = [
  'resume_id', 'ats_score', 'overall_score', 'summary', 'strengths',
  'weaknesses', 'missing_skills', 'grammar_score', 'formatting_score', 'keyword_score'
];

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resume_analysis ORDER BY analysis_id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch resume analyses' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resume_analysis WHERE analysis_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Analysis not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

router.post('/', async (req, res) => {
  const b = req.body;
  if (!b.resume_id) return res.status(400).json({ error: 'resume_id is required' });
  try {
    const result = await pool.query(
      `INSERT INTO resume_analysis
        (resume_id, ats_score, overall_score, summary, strengths, weaknesses,
         missing_skills, grammar_score, formatting_score, keyword_score, analyzed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW()) RETURNING *`,
      [b.resume_id, b.ats_score || null, b.overall_score || null, b.summary || null,
       b.strengths || null, b.weaknesses || null, b.missing_skills || null,
       b.grammar_score || null, b.formatting_score || null, b.keyword_score || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create analysis' });
  }
});

router.put('/:id', async (req, res) => {
  const b = req.body;
  try {
    const setClauses = FIELDS.map((f, i) => `${f} = COALESCE($${i + 1}, ${f})`).join(', ');
    const values = FIELDS.map((f) => b[f] ?? null);
    const result = await pool.query(
      `UPDATE resume_analysis SET ${setClauses} WHERE analysis_id = $${FIELDS.length + 1} RETURNING *`,
      [...values, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Analysis not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update analysis' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM resume_analysis WHERE analysis_id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Analysis not found' });
    res.json({ message: 'Analysis deleted', analysis: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete analysis' });
  }
});

module.exports = router;
