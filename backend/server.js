const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});