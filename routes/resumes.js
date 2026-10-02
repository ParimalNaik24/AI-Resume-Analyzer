const express = require('express');
const pool = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

// GET all resumes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resumes ORDER BY resume_id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// GET one resume
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resumes WHERE resume_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resume not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

// CREATE resume
router.post('/', async (req, res) => {
  const { user_id, file_name, file_path, file_type, resume_text } = req.body;
  if (!user_id || !file_name) {
    return res.status(400).json({ error: 'user_id and file_name are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO resumes (user_id, file_name, file_path, file_type, resume_text, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [user_id, file_name, file_path || null, file_type || null, resume_text || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create resume' });
  }
});

// UPDATE resume
router.put('/:id', async (req, res) => {
  const { user_id, file_name, file_path, file_type, resume_text } = req.body;
  try {
    const result = await pool.query(
      `UPDATE resumes SET user_id = COALESCE($1, user_id),
        file_name = COALESCE($2, file_name),
        file_path = COALESCE($3, file_path),
        file_type = COALESCE($4, file_type),
        resume_text = COALESCE($5, resume_text)
       WHERE resume_id = $6 RETURNING *`,
      [user_id, file_name, file_path, file_type, resume_text, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resume not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update resume' });
  }
});

// DELETE resume
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM resumes WHERE resume_id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resume not found' });
    res.json({ message: 'Resume deleted', resume: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

module.exports = router;
