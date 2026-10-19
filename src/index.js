const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const attemptRoutes = require('./routes/attemptRoutes');
const projectRoutes = require('./routes/projectRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL, // e.g., http://localhost:5173
    process.env.MAIN_SITE_URL // e.g., http://localhost:3000
  ],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/projects', projectRoutes);

// Health Check
app.get('/health', (req, res) => res.status(200).send('Assessment API Running'));

// Database Connection
mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log('✅ Connected to MongoDB (Shared with Main Site)');
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));