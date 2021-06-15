const express = require('express');
const { access } = require('fs/promises');
const app= express();

const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
// for file handling
const multer = require('multer');
const methodOverride = require('method-override');
const fs = require('fs');

dotenv.config({path:'./config/config.env'});

// requir auth route
const authRoute = require('./routes/auth');
// require user route
const userRoute = require('./routes/user');
// require product route
const productRoute = require('./routes/products');
// require Deal route
const dealRoute = require('./routes/deal')

// require userModel
const User = require('./models/usermodel');
// require product Model
const Product = require('./models/products');

mongoose.connect('mongodb://localhost:27017/farmerport', {
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

//middleware for sassion
app.use(session({
    secret: 'login/signup application',
    resave:true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy({usernameField: 'email'}, User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// middlewares flash massages
app.use(flash());

// setting flash globally
app.use((req,res,next)=>{
    res.locals.success_msg = req.flash(('success_msg'));
    res.locals.error_msg = req.flash(('error_msg'));
    res.locals.error = req.flash(('error'));
    res.locals.currUser = req.user;
    next();
})

// middlewares
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded());
app.use(express.static('public'));
app.use(authRoute);
app.use(userRoute);
app.use(productRoute);
app.use(dealRoute);

const port = process.env.PORT;
app.listen(port,()=>{
    console.log("server started at port 7000");
})