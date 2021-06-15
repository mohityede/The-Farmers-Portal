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
const { findById } = require('../models/usermodel');

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

router.get('/', (req,res)=>{
    Product.find({},(err,pro)=>{
        if(err){
            console.log("error in finding product: home")
        }
        User.find({},(err,user)=>{
            if(err){
                console.log("error in finding user : home")
            }
            return res.render('home',{allUser:user, allPro: pro});
        })
    })
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
        });6
    }).sort({createDate:-1});
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
});

router.get('/product/delete/', (req,res)=>{
    let proId = req.query.id;

    Product.findByIdAndDelete(proId, (err) => {
        if(err){
            console.log("error in deleting Product");
            return;
        }
        req.flash('sucess_msg','Product deleted sucessfully.');
        res.redirect('/profile'); // back means same page..(/)
    });
});

router.get('/product/edit/:id',isAuthenticedUser,(req,res)=>{
    let searchQuery = {_id:req.params.id};
    Product.findOne(searchQuery)
    .then(pro=>{
        return res.render('product/editProduct',{cPro:pro});
    })
    .catch(err=>{
        return console.log("error in redering edit page");
    })
})

router.get('/products/wishlist/:id', (req,res)=>{
    let searchQuery = {_id:req.params.id};
    User.findOne(searchQuery).exec((err,user)=>{
        if(err){
            return console.log("error in user find")
        }
        let dataArr = user.wishlist;
        return res.render('product/wishlist',{arr:dataArr});
})
})

router.get('/product/wishlist/add/',isAuthenticedUser, (req,res)=>{
    let user= req.query.userId;
    let product= req.query.proId;
    let temp;
    Product.findOne({_id:product},(err,pro)=>{

        if(err){
            console.log("error in findig product")
        }

        temp={
            proImg: pro.imgUrl[0],
            proId: pro._id,
            proName: pro.name,
            proAvailable: pro.available,
            proPrice: pro.price
        }
        User.findOneAndUpdate({_id:user},{
            $push:{wishlist:temp}
        })
        .then(user=>{
            req.flash('success_msg','Product added to wishlist sucessfully.');
            res.redirect('/profile'); // back means same page..(/)
        })
        .catch(err=>{
            return console.log("error in adding whishlist"+err);
        })
    })
})

router.get('/product/wishlist/remove/', (req,res)=>{
    let user= req.query.userId;
    let product= req.query.proId;
    let str = "/products/wishlist/"+user;

    User.updateOne({_id:user},{$pull:{"wishlist":{"proId":product}}})
    .then(data=>{
        return res.redirect(str);
    })
    .catch(err=>{
        console.log("erorr in remove wishlist")
    })
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
        req.flash('success_msg','Product added sucessfully.');
        res.redirect('/profile');
    })
    .catch(err => {
        return console.log("error in create product");
    })
});

router.post('/products/edit/:id',isAuthenticedUser,(req,res)=>{
    let searchQuery = {_id:req.params.id};
    Product.findOneAndUpdate(searchQuery,{
        $set: {
            name: req.body.name,
            available: req.body.available,
            price: req.body.price,
            details: req.body.details
        }
    })
    .then(product => {
        req.flash('success_msg','Product edited sucessfully.');
        res.redirect('/profile');
    })
    .catch(err => {
        console.log("error in update product..");
    })
});

module.exports = router;