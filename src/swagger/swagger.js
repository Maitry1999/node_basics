const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger configuration
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'E-commerce API',  // API Title
        version: '1.0.0',         // API Version
        description: 'This is the API documentation for managing users, products, and authentication in an e-commerce platform.',
    },
    servers: [
        {
            url: process.env.BASE_URL || 'http://localhost:3500',  // Base URL for the API
        },
    ],
};

// Options for swagger-jsdoc
const options = {
    swaggerDefinition,
    apis: ['./src/routes/*.js', './src/controllers/*.js'],  // Path to API route files for Swagger documentation
};

// Generate Swagger specification
const swaggerSpec = swaggerJsdoc(options);

// Function to initialize Swagger UI
const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
