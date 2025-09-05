require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

const routes = require('./routes');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({ app: 'Chrome Accountants API', message: 'API is running' });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

async function start() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not set in environment variables');
    }

    await mongoose.connect(MONGODB_URI);
    // Connection events (optional listeners can be added here)
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();


