const express = require('express');
const router = express.Router();
const path = require('path');
const url= require('url');

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

router.get('/myCart/:id',isAuthenticedUser ,(req,res)=>{
    let searchQuery = {_id:req.params.id};
    User.findOne(searchQuery).exec((err,user)=>{
        if(err){
            return console.log("error in user find")
        }
        let dataArr = user.cart;
        return res.render('deal/cart',{arr:dataArr});
    })
})

router.get('/cart/remove/',isAuthenticedUser, (req,res)=>{
    let user= req.query.userId;
    let product= req.query.proId;
    let cardId = req.query.cartId;
    let proQuan = req.query.proQuan;
    let str = "/myCart/"+user;
    User.findOneAndUpdate({_id:user},{$pull:{"cart":{"_id":cardId}}})
    .then(data=>{
        Product.findOne({_id:product})
        .then(pro=>{
            pro.available = parseInt(pro.available) + parseInt(proQuan) ;
            pro.save(err=>{
                if(err){
                    console.log("error in saving remove cart")
                }
            })
            return res.redirect(str);
        })
    })
    .catch(err=>{
        console.log("erorr in remove wishlist")
    })
})

router.get('/payment/offline',isAuthenticedUser, (req,res)=>{
    res.render('deal/offlinePay');
})

router.get('/payment/online/',isAuthenticedUser, (req,res)=>{
    let proQuery = req.query.proId;
    let amt= req.query.amount;
    Product.findOne({_id:proQuery},(err,pro)=>{
        if(err){
            console.log("error in find product online payment")
        }
        User.findOne({_id:pro.producer},(err,user)=>{
            if(err){
                console.log("error in find user online payment")
            }
            return res.render('deal/onlinePay',{receiver:user,amt:amt});
        })
    })
})

router.get('/deal/bid/:id',isAuthenticedUser, (req,res)=>{
    let searchQuery = req.params.id;
    Product.findOne({_id:searchQuery},(err,pro)=>{
        if(err){
            console.log("error in find product bid")
        }
        res.render('deal/bid',{pro:pro});
    })
})

router.get('/notification/:id',isAuthenticedUser, (req,res)=>{
    res.render('other/notification')
})

router.get('/requestSample/',isAuthenticedUser, (req,res)=>{
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

router.get('/bid/accept/',isAuthenticedUser, (req,res)=>{
    let consId = req.query.consId
    let bidId = req.query.bidId
    let prc = req.query.bidPrice
    let quan = req.query.bidQuan
    let negQuan = parseInt((-1)*quan)
    Product.findOneAndUpdate({'bid._id':bidId},{
        $set:{'bid.$.status': 'accepted'},
        $inc:{'available': negQuan}
    },{new:true})
    .then(bids=>{
        let temp={
            proImg: bids.imgUrl[0],
            proId: bids._id,
            proName: bids.name,
            proQuantity: quan,
            proPrice: prc
        }
        User.updateOne({_id:consId},{
            $push:{notification:`Your bid request for ${temp.proName} is accepted in price ₹ ${prc}`,cart:temp}
        })
        .then(data=>{
            return res.redirect('back');
        })
    })
    .catch(err=>{
        console.log("error in bid accept"+err);
    })
})

router.get('/bid/reject/',isAuthenticedUser, (req,res)=>{
    let consId = req.query.consId
    let bidId = req.query.bidId
    let proName = req.query.proName

    Product.updateOne({'bid._id':bidId},{
        $set:{'bid.$.status': 'rejected'}
    })
    .then(bids=>{
        User.updateOne({_id:consId},{
            $push:{notification:`Your bid request for ${proName} is rejected`}
        })
        .then(data=>{
            return res.redirect('back');
        })
    })
    .catch(err=>{
        console.log("error in bid reject");
    })
})

// POST request
router.post('/cart/add/',isAuthenticedUser, (req,res)=>{
    let user= req.query.userId;
    let product= req.query.proId;
    let reqQuan = req.body.quantity;
    let temp;
    Product.findOne({_id:product},(err,pro)=>{
        if(err){
            console.log("error in findig product during add cart")
        }
        pro.available= pro.available-reqQuan;
        pro.save((err)=>{
            if(err){
                console.log("error in upadating available")
            }
        })
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
            return console.log("error in adding whishlist");
        })
    })
})

router.post('/bid/create/',isAuthenticedUser, (req,res)=>{
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

    Product.findOneAndUpdate(proSearch,{
        $push: {bid:updateData}
    },{upsert:true})
    .then(product => {
        User.findOneAndUpdate({_id:product.producer},{
            $push:{notification:`Bid request for ${product.name} from ${updateData.consumerName}`}
        },{new:true,upsert:true})
        .then(farmer=>{
            User.findOneAndUpdate({_id:consumer},{
                $push:{notification:`Bid request send to ${farmer.name} for ${product.name} send successfully`}
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