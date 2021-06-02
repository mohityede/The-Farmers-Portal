const express = require('express');
const router = express.Router();

// require userModel
const User = require('../models/usermodel');

// function to check user is authonticated or not
function isAuthenticedUser(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash('error_msg','Please Login First');
    res.redirect('/login');
}

router.get('/products/create',isAuthenticedUser, (req,res)=>{
    res.render('product/createProduct');
});

router.get('/products/show',isAuthenticedUser,(req,res)=>{
    res.render('product/showProduct');
});

router.get('/products/all',isAuthenticedUser,(req,res)=>{
    res.render('product/allProducts');
})

module.exports = router;