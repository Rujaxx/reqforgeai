const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/upload', require('./routes/upload.route'));

// Root endpoint
app.get('/', (req, res) => {
  res.send('Backend API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});