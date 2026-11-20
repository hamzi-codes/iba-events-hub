const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
  if (mongoose.connection.readyState === 1) return; // already connected
  await mongoose.connect(env.mongoUri);
  console.log('MongoDB connected');
}

module.exports = connectDB;