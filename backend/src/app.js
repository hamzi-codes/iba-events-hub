const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const browseRoutes = require('./routes/browse');
const eventsRoutes = require('./routes/events');
const approvalsRoutes = require('./routes/approvals');
const adminRoutes = require('./routes/admin');
const connectDB = require('./config/db');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// On serverless hosts (Vercel) nothing runs server.js, so connect on the first request.
// The promise is cached, so later requests do not reconnect. Locally, server.js connects
// first and this does nothing.
let dbReady = null;
app.use(async (req, res, next) => {
  try {
    if (!dbReady) dbReady = connectDB();
    await dbReady;
    next();
  } catch (err) {
    dbReady = null;
    next(err);
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', eventsRoutes); 
app.use('/api/v1', browseRoutes);
app.use('/api/v1/approvals', approvalsRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;