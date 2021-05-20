const express = require('express');
const router = express.Router();
const passport = require('passport');

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

// GET routes
router.get('/login',(req,res)=>{
    res.render('auth/login');
});

router.get('/signUp',(req,res)=>{
    res.render('auth/signUp');
});

router.get('/forgotPassword',(req,res)=>{
    res.render('auth/forgotPassword');
});

router.get('/',(req,res)=>{
    res.render('home');
});

router.get('/logOut',(req,res)=>{
    req.logout();
    req.flash('success_msg','You logged out successfully');
    res.redirect('/login');
})

//POST routes
router.post('/login', passport.authenticate('local',{
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: 'Invalid Email or Password. Try Again!'
}));
router.post('/signUp',(req,res)=>{
    let {name,phone,email,password} = req.body;
    let userData = {
        name: name,
        phone: phone,
        email: email
    }
    User.register(userData, password, (err,user)=>{
        if(err){
            req.flash('error_msg','ERROR: '+err);
            res.redirect('/signUp');
        }
        passport.authenticate('local') (req,res,()=>{
            req.flash('success_msg','Account created successfully');
            res.redirect('/login');
        });
    });
});

module.exports = router;