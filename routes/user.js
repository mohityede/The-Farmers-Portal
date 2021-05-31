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

router.get('/profile',isAuthenticedUser, (req,res)=>{
    res.render('user/profile');
});

router.get('/profile/edit',isAuthenticedUser,(req,res)=>{
    res.render('user/edit');
});

module.exports = router;