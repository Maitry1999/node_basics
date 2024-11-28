const express = require('express');
const app = express();
const mongoose = require('./db/config');
const User = require('./db/users');
const Product = require('./db/products');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const jwtkey = 'e-commerce';
const image = require('./image_upload/multer_config');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

app.use(cors());
app.use(express.json());

// Swagger setup
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'E-commerce API',
        version: '1.0.0',
        description: 'API for managing users and products in an e-commerce platform.',
    },
    servers: [
        {
            url: 'http://localhost:3100',
        },
    ],
};

const options = {
    swaggerDefinition,
    apis: ['./index.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// JWT verification middleware
function verifyToken(req, res, next) {
    let token = req.headers['authorization'];

    if (token) {
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length);
        } else {
            token = null;
        }
        jwt.verify(token, jwtkey, (err, user) => {
            if (err) {
                res.sendStatus(403);
            } else {
                req.user = user;
                next();
            }
        });
    } else {
        res.sendStatus(401);
    }
}

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registers a new user
 *     description: This endpoint allows a new user to register by providing email, password, and confirmation password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password (minimum 8 characters)
 *               password_confirmation:
 *                 type: string
 *                 format: password
 *                 description: Confirmation of user's password
 *     responses:
 *       201:
 *         description: User successfully registered
 *       400:
 *         description: Validation errors or email already registered
 *       500:
 *         description: Internal server error
 */

app.post(
    '/register',
    [
        check('email').isEmail().withMessage('Invalid email address'),
        check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
        check('password_confirmation')
            .custom((value, { req }) => value === req.body.password)
            .withMessage('Password and Confirm Password must be the same'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: false,
                message: 'Validation errors',
                data: errors.array(),
            });
        }

        try {
            const { email, password } = req.body;
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    status: false,
                    message: 'Email is already registered',
                    data: null,
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({ email, password: hashedPassword });
            await user.save();

            const result = user.toObject();
            delete result.password;

            jwt.sign({ user: result }, jwtkey, (err, token) => {
                if (err) {
                    return res.status(500).json({
                        status: false,
                        message: 'Error generating token',
                        data: null,
                    });
                }
                res.status(201).json({
                    status: true,
                    message: 'User registered successfully',
                    data: { user: result, token },
                });
            });
        } catch (error) {
            console.error('Error in registration:', error);
            res.status(500).json({
                status: false,
                message: 'Internal server error',
                data: error.message,
            });
        }
    }
);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Logs in an existing user
 *     description: This endpoint logs in a user using their email and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Invalid email or password
 *       500:
 *         description: Internal server error
 */

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: false,
                message: 'Email and password are required',
                data: null,
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                status: false,
                message: 'User not found',
                data: null,
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: false,
                message: 'Invalid credentials',
                data: null,
            });
        }

        const result = user.toObject();
        delete result.password;

        jwt.sign({ user: result }, jwtkey, (err, token) => {
            if (err) {
                return res.status(500).json({
                    status: false,
                    message: 'Error generating token',
                    data: null,
                });
            }

            res.status(200).json({
                status: true,
                message: 'Login successful',
                data: { user: result, token },
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            status: false,
            message: 'Internal server error',
            data: error.message,
        });
    }
});

/**
 * @swagger
 * /add-product:
 *   post:
 *     summary: Adds a new product
 *     description: Adds a new product to the database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the product
 *               price:
 *                 type: number
 *                 description: Price of the product
 *               category:
 *                 type: string
 *                 description: Category of the product
 *               company:
 *                 type: string
 *                 description: Manufacturer of the product
 *     responses:
 *       201:
 *         description: Product added successfully
 *       500:
 *         description: Internal server error
 */

app.post('/add-product', async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({
            status: false,
            message: 'Internal server error',
            data: error.message,
        });
    }
});

// Other routes can follow the same pattern, adding appropriate Swagger annotations.

app.listen(3100, () => {
    console.log('Server listening on port 3000!');
});
