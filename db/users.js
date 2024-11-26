const mongoose = require('mongoose'); const productSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});
const product = mongoose.model('users', productSchema);

module.exports = product;