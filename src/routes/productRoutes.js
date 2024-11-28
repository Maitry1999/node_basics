const express = require('express');
const {
    addProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

const router = express.Router();

/**
 * @route   POST /api/products
 * @desc    Add a new product
 */
/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Add a new product
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
 *                 required: true
 *               price:
 *                 type: number
 *                 description: Price of the product
 *                 required: true
 *               category:
 *                 type: string
 *                 description: Category of the product
 *               company:
 *                 type: string
 *                 description: Manufacturer of the product
 *     responses:
 *       201:
 *         description: Product added successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/', addProduct);

/**
 * @route   GET /api/products
 * @desc    Get all products
 */
router.get('/', getProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get a product by ID
 */
router.get('/:id', getProductById);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product by ID
 */
router.put('/:id', updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product by ID
 */
router.delete('/:id', deleteProduct);

module.exports = router;
