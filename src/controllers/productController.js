const Product = require('../models/Product');
const createResponse = require('../utils/responseUtils');  // Import the response utility

// Add a new product
const addProduct = async (req, res) => {
    try {
        const { name, price, category, company } = req.body;

        if (!name || !price || !category || !company) {
            return res.status(400).json(createResponse('error', 'All fields are required (name, price, category, company)', null));
        }

        const product = new Product({ name, price, category, company });
        await product.save();

        res.status(201).json(createResponse('success', 'Product added successfully', product));
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json(createResponse('error', 'Internal server error', null, error.message));
    }
};

// Get all products with pagination
const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const products = await Product.find().skip(startIndex).limit(limit);
        const totalProducts = await Product.countDocuments();

        res.status(200).json(createResponse('success', 'Products fetched successfully', {
            totalProducts,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            products
        }));
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json(createResponse('error', 'Internal server error', null, error.message));
    }
};

// Get a single product by ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json(createResponse('error', 'Product not found', null));
        }

        res.status(200).json(createResponse('success', 'Product fetched successfully', product));
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json(createResponse('error', 'Internal server error', null, error.message));
    }
};

// Update a product by ID
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const product = await Product.findByIdAndUpdate(id, updates, { new: true });
        if (!product) {
            return res.status(404).json(createResponse('error', 'Product not found', null));
        }

        res.status(200).json(createResponse('success', 'Product updated successfully', product));
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json(createResponse('error', 'Internal server error', null, error.message));
    }
};

// Delete a product by ID
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json(createResponse('error', 'Product not found', null));
        }

        res.status(200).json(createResponse('success', 'Product deleted successfully', product));
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json(createResponse('error', 'Internal server error', null, error.message));
    }
};

module.exports = {
    addProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
};
