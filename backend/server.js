const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');
require('dotenv').config();

const connectDb = require('./database/connectDb');
// Connect to MongoDB
connectDb();

app.use(cors());
// Middleware
app.use(express.json());

// Routes
app.use('/upload', require('./routes/upload.route'));
app.use('/projects', require('./routes/project.route'));

// Root endpoint
app.get('/', (req, res) => {
  res.send('Backend API is running');
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});