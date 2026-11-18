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

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', (req, res) => {
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