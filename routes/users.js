const express = require('express');
const pool = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

// Never return password_hash to the frontend
const SAFE_COLUMNS = 'user_id, full_name, email, created_at, updated_at, skills';

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT ${SAFE_COLUMNS} FROM users ORDER BY user_id DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT ${SAFE_COLUMNS} FROM users WHERE user_id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// UPDATE user (full_name, email, skills only — password changes should go through a dedicated flow)
router.put('/:id', async (req, res) => {
  const { full_name, email, skills } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET
        full_name = COALESCE($1, full_name),
        email = COALESCE($2, email),
        skills = COALESCE($3, skills),
        updated_at = NOW()
       WHERE user_id = $4 RETURNING ${SAFE_COLUMNS}`,
      [full_name, email, skills, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(`DELETE FROM users WHERE user_id = $1 RETURNING ${SAFE_COLUMNS}`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
