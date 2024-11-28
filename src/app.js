const express = require('express');
const cors = require('cors');
const setupSwagger = require('./swagger/swagger');  // Import Swagger setup
const userRoutes = require('./routes/userRoutes');  // User routes
const productRoutes = require('./routes/productRoutes');  // Product routes
require('dotenv').config();  // Load environment variables

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Setup Swagger UI
setupSwagger(app);

// Route definitions
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// Default 404 error handler
app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start the server
const port = process.env.PORT || 3500;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
