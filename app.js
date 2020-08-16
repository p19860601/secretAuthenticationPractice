//jshint esversion:6

//Third Party OAuth2.0//Level 6 Authentication//
//Open standard token based authorisation


require('dotenv').config(); //will be active and running//have to be on top!

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

//require the necessary software
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

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
    password:String,
    googleId:String,
    secret:String
});

//enable passport-local-mongoose 
//hash and salt passwords and save our users to mongoDB
userSchema.plugin(passportLocalMongoose);

//enable findOrCreate for oAuth2.0
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

//passport-local configuration
//serialise creates cookies and stuff the message in
//deserialize crumbles the cookie, destroys it
passport.use(User.createStrategy());

//passport not just local authorisation, allows 3rd party
//will work for all kind of strategies
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });


//setting up Google authorisation
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/SecretPractice",
    userProfileURL: "https://www.googleapies.com/oauth2/v3/userinfo" 
  },
  //callback function
  function(accessToken, refreshToken, profile, cb) {

    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//view websites
app.get("/", function(req, res){
    res.render("home");
});

//for google
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

  app.get("/auth/google/SecretPractice", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get("/login", function(req, res){
    res.render("login");
});
app.get("/register", function(req, res){
    res.render("register");
});

//creating a way to 'secrets' when cookie is enabled, without logging in again
 app.get("/secrets", function(req, res){
    //no need to check authentication anymore
    User.find({"secret":{$ne:null}}, function(err, foundUsers){
        if(err){
            console.log(err);
        }else{
            if (foundUsers){
                res.render("secrets", {usersWithSecrets: foundUsers});
            }
        }
    });
 });

 // submit page, submitting more secrets
 app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
 });
 app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;

    //find the user and save their secret in to their file
     console.log(req.user.id);

     User.findById(req.user.id, function(err, foundUser){
         if(err){
             console.log(err);
         }else{
             if(foundUser){
                 foundUser.secret = submittedSecret;
                 foundUser.save(function(){
                     res.redirect("/secrets");
                 });
             }
         }
     });
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