const express = require('express');
const router = express.Router();
const path = require('path');


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

router.get('/myCart/:id',(req,res)=>{
    let searchQuery = {_id:req.params.id};
    User.findOne(searchQuery).exec((err,user)=>{

        if(err){
            return console.log("error in user find")
        }
        let dataArr = user.cart;
        return res.render('deal/cart',{arr:dataArr});
    })
})

router.get('/cart/remove/', (req,res)=>{
    let user= req.query.userId;
    let product= req.query.proId;
    let str = "/myCart/"+user;

    User.updateOne({_id:user},{$pull:{"cart":{"proId":product}}})
    .then(data=>{
        return res.redirect(str);
    })
    .catch(err=>{
        console.log("erorr in remove wishlist")
    })
})

router.get('/payment/offline',(req,res)=>{
    res.render('deal/offlinePay');
})

router.get('/payment/online/',(req,res)=>{
    let proQuery = req.query.proId;
    let amt= req.query.amount;
    Product.findOne({_id:proQuery},(err,pro)=>{
        if(err){
            console.log("error in find product online payment")
        }

        User.findOne({_id:pro.producer},(err,user)=>{

            if(err){
                console.log("error in find user onlin payment")
            }
            return res.render('deal/onlinePay',{receiver:user,amt:amt});
        })
    })
})

router.get('/deal/bid/:id',(req,res)=>{
    let searchQuery = req.params.id;
    Product.findOne({_id:searchQuery},(err,pro)=>{
        if(err){
            console.log("error in find product bid")
        }
        res.render('deal/bid',{pro:pro});
    })
})

router.get('/notification/:id',(req,res)=>{
    res.render('other/notification')
})

router.get('/requestSample/',(req,res)=>{
    let currUserName = req.query.cUserName;
    let producer = req.query.producer;
    let productName = req.query.productName;
    User.updateOne({_id:producer},{
        $push:{notification:`${currUserName} request for sample of ${productName}`}
    })
    .then(user=>{
        req.flash('success_msg','Request send seccefullly');
        res.redirect('/profile');
    })
    .catch(err=>{
        console.log("error in request sample");
    })
})

// POST req
router.post('/cart/add/',(req,res)=>{
    let user= req.query.userId;
    let product= req.query.proId;
    let reqQuan = req.body.quantity;
    let temp;
    Product.findOne({_id:product},(err,pro)=>{
        if(err){
            console.log("error in findig product")
        }

        temp={
            proImg: pro.imgUrl[0],
            proId: pro._id,
            proName: pro.name,
            proQuantity: reqQuan,
            proPrice: pro.price
        }
        User.findOneAndUpdate({_id:user},{
            $push:{cart:temp}
        })
        .then(user=>{
            req.flash('success_msg','Product added to cart sucessfully.');
            res.redirect('/profile'); // back means same page..(/)
        })
        .catch(err=>{
            return console.log("error in adding whishlist"+err);
        })
    })
})

router.post('/bid/create/',(req,res)=>{
    let consumer = req.query.currUser;
    let proSearch = {_id:req.query.proId};
    let data = req.body

    let updateData={
        consumerName: data.consumerName,
        consumerId: consumer,
        quantity: data.quantity,
        bidPrice: data.price,
        remark: data.remarks
    };
    console.log(updateData)
    Product.findOneAndUpdate(proSearch,{
        $push: {bid:updateData}
    },{upsert:true})
    .then(product => {
        console.log(product)
        User.findOneAndUpdate({_id:product.producer},{
            $push:{notification:`Bid request for "${product.name}"`}
        },{upsert:true})
        .then(farmer=>{
            console.log(farmer)
            User.findOneAndUpdate({_id:consumer},{
                $push:{notification:`Bid request send for "${product.name}"`}
            },{upsert:true})
            .then(cons=>{
                req.flash('success_msg','Product bit request send sucessfully.');
                res.redirect('/profile');
            })
        })
    })
    .catch(err => {
        console.log("error in update bid..");
    })
})

module.exports = router;