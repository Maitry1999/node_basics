const express = require('express');
const app = express();
const mongoose = require('./db/config');
const User = require('./db/users');
const Product = require('./db/products');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const jwtkey = 'e-commerce';
app.use(cors());
app.use(express.json());

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
        })
    } else {
        res.sendStatus(401);
    }
}
app.get('/', verifyToken, (req, res) => {
    res.send('Hello World!')
})

app.post('/register', async (req, res) => {

    console.log(req.body);

    const user = await User(req.body).save();
    const result = user.toObject();
    delete result.password;
    jwt.sign({ user: user }, jwtkey, { expiresIn: '1h' }, (err, token) => {

        if (err) {
            res.send(err);
        } else {
            res.send({ user, token });
        }
    })


})
app.post('/add-product', async (req, res) => {

    const product = await Product(req.body).save();

    res.send(product);
})
app.get('/get-products', async (req, res) => {

    const products = await Product.find();
    res.send(products);
})
app.post('/login', async (req, res) => {
    var user = await User.findOne(req.body).select('-password');
    if (user) {
        jwt.sign({ user: user }, jwtkey, { expiresIn: '1h' }, (err, token) => {

            if (err) {
                res.send(error);
            } else {
                res.send({ user, token });
            }
        })

    } else {
        res.send({ error: "User not found" })
    }
})
app.delete('/delete-product/:id', async (req, res) => {

    const product = await Product.deleteOne({ _id: req.params.id });
    res.send(product);

})
app.get('/search/:key', verifyToken, async (req, res) => {

    let products = await Product.find({
        "$or": [
            { name: { $regex: req.params.key } },
            { category: { $regex: req.params.key } },
            { company: { $regex: req.params.key } }
        ]
    });
    res.send(products);
})
app.put('/update-product/:id', async (req, res) => {

    let product = await Product.updateOne({ _id: req.params.id }, { $set: req.body });
    res.send(product);
})
app.listen(1255, () => {
    console.log('Example app listening on port 5050!')
})
