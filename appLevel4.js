//jshint esversion:6

//Hashing and Salting//Level 4 Authentication//
//password and uniqe numbers combined together



require('dotenv').config(); //will be active and running//have to be on top!


const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { stringify } = require("querystring");

//suing bcrypt and saltrounds to encrypt
const bcrypt = require("bcrypt");
const saltRounds = 10;


const app = express();

//use static forders for non-static things
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

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

//connect to our database
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect("mongodb://localhost:27017/userDB");

//set up our new user database, Register 
//encrypt database with mongoose-encrypt
//we need to modify our existing schmea
// userSchema = {
//     email: String,
//     password: String
// }
const userSchema = new mongoose.Schema({
    email: String,
    password:String
});


const User = new mongoose.model("User", userSchema);

//create register route
app.post("/register", function(req, res){

    //using bcrypt
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {

        const newUser= new User({
            email:req.body.username,
            password: hash
        });
        newUser.save(function(err){
            if(err){
                console.log(err);
            } else {
                res.render("secrets");
            }
        });
    
    });
});

//for Login route
app.post("/login", function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email:username}, function(err, foundUser){
        if(err){
            console.log(err);
        } else {
            if(foundUser){
                //bcrypt compare method to check database for password
                    bcrypt.compare(password, foundUser.password, function(err, result){
                        if (result === true){
                            res.render("secrets");
                        }
                    });
                    

            }
        }
    });
});



app.listen(3000, function(){
    console.log("Server started on port 3000");
});

//register users with username and password using level 1 security