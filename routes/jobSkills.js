const express = require('express');
const pool = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM job_skills ORDER BY job_skill_id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch job skills' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM job_skills WHERE job_skill_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job skill not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch job skill' });
  }
});

router.post('/', async (req, res) => {
  const { job_id, skill_id, is_required } = req.body;
  if (!job_id || !skill_id) return res.status(400).json({ error: 'job_id and skill_id are required' });
  try {
    const result = await pool.query(
      `INSERT INTO job_skills (job_id, skill_id, is_required) VALUES ($1,$2,$3) RETURNING *`,
      [job_id, skill_id, is_required ?? false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create job skill' });
  }
});

router.put('/:id', async (req, res) => {
  const { job_id, skill_id, is_required } = req.body;
  try {
    const result = await pool.query(
      `UPDATE job_skills SET job_id = COALESCE($1, job_id),
        skill_id = COALESCE($2, skill_id),
        is_required = COALESCE($3, is_required)
       WHERE job_skill_id = $4 RETURNING *`,
      [job_id, skill_id, is_required, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job skill not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update job skill' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM job_skills WHERE job_skill_id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job skill not found' });
    res.json({ message: 'Job skill deleted', jobSkill: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete job skill' });
  }
});

module.exports = router;
