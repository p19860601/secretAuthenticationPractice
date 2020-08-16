//jshint esversion:6

//Cookies and Session//Level 5 Authentication//
//using Passport.authenticate('');
//npm istalls we will ned are:
//passport, passport-local, passport-local-mongoose, express-session


require('dotenv').config(); //will be active and running//have to be on top!

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

//require the necessary software
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

//use static forders for non-static things
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));


//setting up session
app.use(session({
    secret:"Our little secret.",
    resave: false,
    saveUninitialized: false
}));

//initialise passport and use it to deal with session
app.use(passport.initialize());
app.use(passport.session());

//connect to our database
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set("useCreateIndex", true);
mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password:String
});

//enable passport-local-mongoose 
//hash and salt passwords and save our users to mongoDB
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

//passport-local configuration
//serialise creates cookies and stuff the message in
//deserialize crumbles the cookie, destroys it
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//view websites
app.get("/", function(req, res){
    res.render("home");
});
app.get("/login", function(req, res){
    res.render("login");
});
app.get("/register", function(req, res){
    res.render("register");
});

//creating a way to 'secrets' when cookie is enabled, without logging in again
 app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("login");
    }
 });

//creating the logout button
app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

//create register route
app.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

//for Login route
app.post("/login", function(req, res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
        //use passport to log them in and authenticate them
        req.login(user, function(err){
            if(err){
                //if unable to find user in our database
                console.log(err);
            }else{
                //if no error go to the page
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secrets");
                });
            }
        });
});



app.listen(3000, function(){
    console.log("Server started on port 3000");
});