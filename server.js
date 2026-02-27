const express   = require('express');
const path      = require('path');
const rateLimit = require('express-rate-limit');

const app = express();

// Rate limiter: max 100 requests per IP per minute
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

app.use(limiter);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const itemsRouter = require('./routes/items');
app.use('/api/items', itemsRouter);

// Fallback: serve the SPA for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

/* istanbul ignore next */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Campus Reconnect running on http://localhost:${PORT}`);
  });
}

module.exports = app;
