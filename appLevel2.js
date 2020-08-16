//jshint esversion:6
require('dotenv').config(); //will be active and running//have to be on top!


const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { stringify } = require("querystring");
const encrypt =  require("mongoose-encryption");

const app = express();


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
//i cut the secret key from here and pasted it into my secret file
//only encrypt certain fields!
userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields:['password'] });


const User = new mongoose.model("User", userSchema);

//create register route
app.post("/register", function(req, res){
    const newUser= new User({
        email:req.body.username,
        password:req.body.password
    });
    newUser.save(function(err){
        if(err){
            console.log(err);
        } else {
            res.render("secrets");
        }
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
                if(foundUser.password === password){
                    res.render("secrets");
                }
            }
        }
    });
});



app.listen(3000, function(){
    console.log("Server started on port 3000");
});

//register users with username and password using level 1 security