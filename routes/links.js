const express = require('express');
const router = express.Router();
const db = require('../db');
const validator = require('validator');

const CODE_REGEX = /^[A-Za-z0-9]{6,8}$/;

// Create a link
router.post('/', async (req, res) => {
  try {
    const { url, code } = req.body;

    if (!url || !validator.isURL(url, { require_protocol: true })) {
      return res.status(400).json({ error: 'Invalid URL. Include https:// or http://' });
    }

    let finalCode = code;

    // If custom code provided
    if (finalCode) {
      if (!CODE_REGEX.test(finalCode)) {
        return res.status(400).json({ error: 'Code must match [A-Za-z0-9]{6,8}' });
      }

      const exists = await db.query('SELECT code FROM links WHERE code=$1', [finalCode]);
      if (exists.rows.length > 0) {
        return res.status(409).json({ error: 'Code already exists' });
      }
    } else {
      // Auto-generate 7 char code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

      const generate = () => {
        let s = '';
        for (let i = 0; i < 7; i++) s += chars[Math.floor(Math.random() * chars.length)];
        return s;
      };

      while (true) {
        finalCode = generate();
        const test = await db.query('SELECT code FROM links WHERE code=$1', [finalCode]);
        if (test.rows.length === 0) break;
      }
    }

    await db.query('INSERT INTO links(code, url) VALUES($1,$2)', [finalCode, url]);

    const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    return res.status(201).json({
      code: finalCode,
      shortUrl: `${base}/${finalCode}`,
      url
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List all links
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT code, url, clicks, created_at, last_clicked FROM links ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get stats for one code
router.get('/:code', async (req, res) => {
  try {
    const code = req.params.code;

    const link = await db.query(
      'SELECT code, url, clicks, created_at, last_clicked FROM links WHERE code=$1',
      [code]
    );

    if (link.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    res.json(link.rows[0]);

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a link
router.delete('/:code', async (req, res) => {
  try {
    const code = req.params.code;

    const result = await db.query('DELETE FROM links WHERE code=$1', [code]);

    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });

    res.status(204).send();

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔥 Health check endpoint (added as required)
router.get('/healthz', (req, res) => {
  res.status(200).json({
    ok: true,
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
