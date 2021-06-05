const express = require('express');
const router = express.Router();
const path = require('path');
// for file handling
const multer = require('multer');
const methodOverride = require('method-override');
const fs = require('fs');

// require userModel
const User = require('../models/usermodel');
// require product Model
const Product = require('../models/products');

// function to check user is authonticated or not
function isAuthenticedUser(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash('error_msg','Please Login First');
    res.redirect('/login');
}

//set image storage
let storage = multer.diskStorage({
    destination: './public/uploadImg/',
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});

function checkFileType(file, cb) {
    const fileType = /jpeg|jpg|png|gif/;
    const extName = fileType.test(path.extname(file.originalname).toLowerCase());
    if (extName) {
        return cb(null, true);
    } else {
        cb('Eroor : please select valid image format');
    }
}

let upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
});

router.get('/products/create',isAuthenticedUser, (req,res)=>{
    res.render('product/createProduct');
});

router.get('/product/details/:id',(req,res)=>{
    Product.findOne({_id:req.params.id},(err, product)=>{
        if(err){
            console.log("error during fatching data");
            return;
        }
        User.findOne({_id:product.producer},(err, user)=>{
            if(err){
                console.log("error in findProducer");
                return;
            }
            return res.render('product/showProduct',{
                pro:product,
                produc:user
            });
        });
    });
});

router.get('/products/all',(req,res)=>{
    // res.render('product/allProducts');
    Product.find({},(err, product)=>{
        if(err){
            console.log("error during fatching data");
            return;
        }
        return res.render('product/allProducts',{
            pro: product
        });
    });
})

router.get('/products/myProducts/:id',(req,res)=>{

    Product.find({producer:req.params.id},(err, product)=>{
        if(err){
            console.log("error during fatching data");
            return;
        }
        return res.render('product/myProducts',{
            pro: product
        });
    });
})

// Post requests
router.post('/products/create',isAuthenticedUser, upload.array('multiFile'),(req,res,next)=>{

    let imgArr = [];
    const files = req.files;
    files.forEach(file => {
        let url = file.path.replace('public', '');
        imgArr.push(url);
    });

    let addPro = {
        name: req.body.name,
        producer : req.body.userId,
        price: req.body.price,
        available: req.body.available,
        details: req.body.details,
        imgUrl:imgArr
    }
    Product.create(addPro)
    .then(product => {
        req.flash('sucess_msg','Product added sucessfully.');
        res.redirect('/profile');
    })
    .catch(err => {
        return console.log("error in create product");
    })
});

module.exports = router;