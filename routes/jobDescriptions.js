const express = require('express');
const pool = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM job_descriptions ORDER BY job_id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch job descriptions' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM job_descriptions WHERE job_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job description not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch job description' });
  }
});

router.post('/', async (req, res) => {
  const { user_id, job_title, company_name, job_description } = req.body;
  if (!user_id || !job_title) {
    return res.status(400).json({ error: 'user_id and job_title are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO job_descriptions (user_id, job_title, company_name, job_description, created_at)
       VALUES ($1,$2,$3,$4, NOW()) RETURNING *`,
      [user_id, job_title, company_name || null, job_description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create job description' });
  }
});

router.put('/:id', async (req, res) => {
  const { user_id, job_title, company_name, job_description } = req.body;
  try {
    const result = await pool.query(
      `UPDATE job_descriptions SET
        user_id = COALESCE($1, user_id),
        job_title = COALESCE($2, job_title),
        company_name = COALESCE($3, company_name),
        job_description = COALESCE($4, job_description)
       WHERE job_id = $5 RETURNING *`,
      [user_id, job_title, company_name, job_description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job description not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update job description' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM job_descriptions WHERE job_id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job description not found' });
    res.json({ message: 'Job description deleted', job: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete job description' });
  }
});

module.exports = router;
