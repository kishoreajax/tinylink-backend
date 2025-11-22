require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const linksRouter = require('./routes/links');
const db = require('./db');

const app = express();

app.use(helmet());
app.use(morgan('tiny'));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

// Health Check
app.get('/healthz', (req, res) => {
  res.json({ ok: true, version: '1.0' });
});

// API Routes
app.use('/api/links', linksRouter);

// Stats page (front-end)
app.get('/code/:code', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'code.html'));
});

// Redirect logic
app.get('/:code', async (req, res) => {
  try {
    const code = req.params.code;

    const link = await db.query('SELECT url FROM links WHERE code=$1', [code]);

    if (link.rows.length === 0) {
      return res.status(404).send('Not found');
    }

    const url = link.rows[0].url;

    await db.query(
      'UPDATE links SET clicks = clicks + 1, last_clicked = now() WHERE code=$1',
      [code]
    );

    res.redirect(302, url);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
