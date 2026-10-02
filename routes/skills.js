const express = require('express');
const pool = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM skills ORDER BY skill_id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM skills WHERE skill_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Skill not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch skill' });
  }
});

router.post('/', async (req, res) => {
  const { skill_name, skill_category } = req.body;
  if (!skill_name) return res.status(400).json({ error: 'skill_name is required' });
  try {
    const result = await pool.query(
      `INSERT INTO skills (skill_name, skill_category, created_at) VALUES ($1,$2, NOW()) RETURNING *`,
      [skill_name, skill_category || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create skill' });
  }
});

router.put('/:id', async (req, res) => {
  const { skill_name, skill_category } = req.body;
  try {
    const result = await pool.query(
      `UPDATE skills SET skill_name = COALESCE($1, skill_name),
        skill_category = COALESCE($2, skill_category)
       WHERE skill_id = $3 RETURNING *`,
      [skill_name, skill_category, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Skill not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM skills WHERE skill_id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Skill not found' });
    res.json({ message: 'Skill deleted', skill: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

module.exports = router;
