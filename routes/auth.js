const express = require('express');
const router = express.Router();
const passport = require('passport');
const crypto = require('crypto');
const async = require('async');
const nodemailer = require('nodemailer');
const validator = require('aadhaar-validator');
const fast2sms = require('fast-two-sms')

// require userModel
const User = require('../models/usermodel');
const { authenticate } = require('passport');

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

router.get('/forgot',(req,res)=>{
    res.render('auth/forgot');
});

router.get('/logOut',isAuthenticedUser,(req,res)=>{
    req.logout();
    req.flash('success_msg','You logged out successfully');
    res.redirect('/login');
})

router.get('/password/change',isAuthenticedUser,(req,res)=>{
    res.render('auth/changePassword');
})

// route for reset password
router.get('/reset/:token', (req, res)=> {
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires : {$gt : Date.now() } })
        .then(user => {
            if(!user) {
                req.flash('error_msg', 'Password reset token in invalid or has been expired.');
                res.redirect('/forgot');
            }
            res.render('auth/newPassword', {token : req.params.token});
        })
        .catch(err => {
            req.flash('error_msg', 'ERROR: Token is expired');
            res.redirect('/forgot');
        });
});

//POST routes
router.post('/verifyAadhar/:id',isAuthenticedUser, (req,res)=>{
    let searchQuery = req.body.aadhar;
    let userId = req.params.id;
    let verify = validator.isValidNumber(searchQuery);
    if(verify){
        User.findOneAndUpdate({_id:userId},{
            $set:{
                aadharNum:searchQuery,
                aadharState: true
            }},{new:false},
            (err,data)=>{
            if(err){
                console.log("error in updating aadhar")
            }
            req.flash('success_msg', 'Aadhar updated succefully');
                res.redirect('/profile');
        })
    }else{
        req.flash('error_msg', 'Aadhar number is not valid');
        res.redirect('/profile');
    }
})

let otp;

router.post('/verifyPhone',isAuthenticedUser, async (req,res)=>{
    let phone = req.body.phone;
    otp = Math.floor(1000 + Math.random() * 9000);
    const response = await fast2sms.sendMessage({authorization : process.env.SMS_API_KEY, message:`The Farmers Portal,\none time password(OTP) is ${otp}. Don't share with anyone.`, numbers:[phone]});
    req.flash('success_msg', `OTP send to your registered mobile number.`);
    res.render('auth/mobileOTP',{phone:phone});
})

router.post('/OTP/verify/',(req,res)=>{
    let enterOTP = req.body.OTP
    let userId = req.query.id
    let ph = req.query.phone
    if(enterOTP==otp){
        User.findOneAndUpdate({_id:userId},{
            $set:{phone:ph,phoneState:true}
        })
        .then(user=>{
            req.flash('success_msg', `mobile number verified successfully`);
            res.redirect('/profile');
        })
        .catch(err=>{
            console.log("error in otp verify")
        })
    }else{
        req.flash('error_msg','OTP not matched');
        return res.render('auth/mobileOTP',{phone:ph});
    }
})

router.post('/login', passport.authenticate('local',{
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: 'Invalid Email or Password. Try Again!'
}));

router.post('/signUp',(req,res)=>{
    let {role,name,phone,email,password} = req.body;
    let userData = {
        role: role,
        name: name,
        phone: phone,
        email: email
    }
    User.find({email:userData.email},(err,user)=>{
        if(err){
            console.log('error in create user')
        }
        if(user.length!=0){
            req.flash('error_msg','existing user, Please Login');
            res.redirect('/signUp');
        }else{
            User.register(userData, password, (err,user)=>{
                if(err){
                    req.flash('error_msg','Something is wrong');
                    res.redirect('/signUp');
                }
                passport.authenticate('local') (req,res,()=>{
                    req.flash('success_msg','Account created successfully');
                    res.redirect('/login');
                });
            });
        }
    })
});

router.post('/password/change',isAuthenticedUser, (req, res)=> {
    if(req.body.password !== req.body.confirmpassword) {
        req.flash('error_msg', "Password don't match. Type again!");
        return res.redirect('/password/change');
    }
    User.findOne({email : req.user.email})
        .then(user => {
            user.setPassword(req.body.password, err=>{
                user.save()
                    .then(user => {
                        req.flash('success_msg', 'Password changed successfully.');
                        res.redirect('/');
                    })
                    .catch(err => {
                        req.flash('error_msg', 'ERROR: in changing password');
                        res.redirect('/password/change');
                    });
            });
        });
});

// route to handle forgot password
router.post('/forgot',(req,res,next)=>{
    let recoveryPassword='';
    async.waterfall([
        (done)=>{
            crypto.randomBytes(30,(err,buf)=>{
                let token = buf.toString('hex');
                done(err,token);
            });
        },
            (token,done)=>{
                User.findOne({email : req.body.email})
                .then(user =>{
                    if(!user){
                        req.flash('error_msg','User does not exit with this email.');
                        return res.redirect('/forgot');
                    }
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 1800000 // 30min
                    user.save(err=>{
                        done(err,token,user);
                    });
                })
                .catch(err=>{
                    req.flash('error_msg','ERROR: in forgot password route');
                    res.redirect('/forgot');
                });
        },
        (token, user) => {
            //    SMTP : Simple mail Transfer Protocol
            let smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user : process.env.GMAIL_EMAIL,
                    pass: process.env.GMAIL_PASSWORD
                }
            });
            let mailOptions = {
                to: user.email,
                from : 'The Farmer Portal yedemohitkumar@gmail.com',
                subject : 'Recovery Email from The Farmer Portal',
                text : 'Please click the following link to recover your passoword: \n\n'+
                        'http://'+ req.headers.host +'/reset/'+token+'\n\n'+
                        'If you did not request this, please ignore this email.'
            };
            smtpTransport.sendMail(mailOptions, err=> {
                req.flash('success_msg', 'Email send with further instructions. Please check that.');
                res.redirect('/forgot');
            });
        }
    ], err => {
        if(err) res.redirect('/forgot');
    });
});

router.post('/reset/:token', (req, res)=>{
    async.waterfall([
        (done) => {
            User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires : {$gt : Date.now() } })
                .then(user => {
                    if(!user) {
                        req.flash('error_msg', 'Password reset token in invalid or has been expired.');
                        return res.redirect('/forgot');
                    }

                    if(req.body.password !== req.body.confirmpassword) {
                        req.flash('error_msg', "Password don't match.");
                        return res.redirect('/forgot');
                    }

                    user.setPassword(req.body.password, err => {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(err => {
                            req.logIn(user, err => {
                                done(err, user);
                            })
                        });
                    });
                })
                .catch(err => {
                    req.flash('error_msg', 'ERROR: '+err);
                    res.redirect('/forgot');
                });
        },
        (user) => {
            let smtpTransport = nodemailer.createTransport({
                service : 'Gmail',
                auth:{
                    user : process.env.GMAIL_EMAIL,
                    pass : process.env.GMAIL_PASSWORD
                }
            });

            let mailOptions = {
                to : user.email,
                from : 'The Farmer Portal yedemohitkumar@gmail.com',
                subject : 'Your password is changed',
                text: 'Hello, '+user.name+'\n\n'+
                      'This is the confirmation that the password for your account '+ user.email+' has been changed.'
            };

            smtpTransport.sendMail(mailOptions, err=>{
                req.flash('success_msg', 'Your password has been changed successfully.');
                res.redirect('/login');
            });
        }

    ], err => {
        res.redirect('/login');
    });
});

module.exports = router;