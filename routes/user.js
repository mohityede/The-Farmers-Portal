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

router.get('/about',(req,res)=>{
    res.render('other/about');
});

router.get('/profile',isAuthenticedUser,(req,res)=>{
    res.render('user/profile');
})

router.get('/farmer/profile/:id',isAuthenticedUser, (req,res)=>{
    let searchQuary = { _id: req.params.id };
    User.findOne(searchQuary)
        .then(user => {
            res.render('user/farmerProfile', { cUser : user });
        })
        .catch(err => {
            console.log("error in showing profile..");
        })
});

router.get('/profile/edit',isAuthenticedUser,(req,res)=>{
    res.render('user/edit');
});

router.get('/farmers',(req,res)=>{
    User.find({},(err, user)=>{
        if(err){
            console.log("error during fatching farmers data ");
            return;
        }
        return res.render('user/allFarmers',{
            farmer: user
        });
    });
});

router.get('/consumers',(req,res)=>{
    User.find({},(err, user)=>{
        if(err){
            console.log("error during fatching consumer data");
            return;
        }
        return res.render('user/allConsumers',{
            farmer: user
        });
    });
});

// Post requests
router.post('/profile/edit/:id',isAuthenticedUser,(req,res)=>{
    let sQuary = {_id:req.params.id};
    User.updateOne(sQuary,{
        $set:{
            name: req.body.name,
            phone: req.body.phone,
            role: req.body.role,
            location: {
                local: req.body.local,
                district: req.body.district,
                state: req.body.state,
                pin: req.body.pin
            },
            bankDetails:{
                bankName: req.body.bankName,
                accNum: req.body.accNum,
                ifsc: req.body.ifsc,
                branch: req.body.branch
            },
            org:req.body.org,
        }
    })
    .then(user => {
        req.flash('sucess_msg','profile ediated sucessfully.');
        res.redirect('/profile');
    })
    .catch(err => {
        console.log("erron in edit..");
    })
});

module.exports = router;