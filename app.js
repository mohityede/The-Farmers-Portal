const express = require('express');
const { access } = require('fs/promises');
const app= express();

const path = require('path');

// middlewares
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded());
app.use(express.static('public'));

//
app.get('/',(req,res)=>{
    res.render('home');
})

app.get('/login',(req,res)=>{
    res.render('account/login');
});

app.get('/signUp',(req,res)=>{
    res.render('account/signUp');
})

app.get('/forgotPassword',(req,res)=>{
    res.render('account/forgotPassword');
})

const port = 7000;
app.listen(port,()=>{
    console.log("server started at port 7000");
})