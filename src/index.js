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
    process.env.FRONTEND_URL, 
    process.env.MAIN_SITE_URL 
  ],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/projects', projectRoutes);

//test
app.get('/', (req, res) => {
  res.send('Totlesoft Data labelling Test Server at Fly.io, Up and Running');
});

// Health Check
app.get('/health', (req, res) => res.status(200).send('Assessment API Running'));

// Database Connection
mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log('✅ Connected to MongoDB (Shared with Main Site)');
    
    // ✅ FIX: Bind to 0.0.0.0 and use Fly's default port 8080 fallback
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));