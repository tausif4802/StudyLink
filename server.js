require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.urlencoded({extended:true}))
const mongoose=require("mongoose");
const validator = require('validator');
const session = require('express-session');
const passport=require("passport")
const nodemailer = require("nodemailer");
const generator = require('generate-password');

const passportLocalMongoose=require("passport-local-mongoose");
app.set("view engine","ejs");
app.use(express.static("public"))
app.use(session({
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized: true,
    cookie : {
        maxAge: 1000* 60 * 60 *24 * 365
    }
}))
app.use(passport.initialize())
app.use(passport.session())
mongoose.connect("mongodb+srv://pervyshrimp:123@peoplecluster.ydugl.mongodb.net/User",{ useNewUrlParser: true, useUnifiedTopology: true  })
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("connected")
});


const userSchema=new mongoose.Schema({
    username:String,
    email:String,
    password:String,
    fullname:String,
    type:String
})

userSchema.plugin(passportLocalMongoose);


const User=new mongoose.model("User",userSchema)

passport.use(User.createStrategy());


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
    if(req.isAuthenticated()){
        res.redirect("/home")
    }else{
        res.redirect("/login")
    }
})
app.get("/login",function(req,res){
    res.render("login")
})
app.get("/signup",function(req,res){
    res.render("signup")
})
app.get("/home",function(req,res){
    if(req.isAuthenticated()){
        res.render("home")
    }else{
        res.redirect("/login")
    }
})


app.post("/signup",function(req,res){
    User.register({username:req.body.username,email:req.body.email,type:req.body.type,fullname:req.body.fullname}, req.body.password, function(err,user){
        if(err){
            console.log(err)
            res.redirect("/signup")
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/home")
            })
        }
    })    
})
app.get("/forgot",function(req,res){
    res.render("forgot")
})

app.post("/forgot",function(req,res){
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'teampaimon@gmail.com',
          pass: 'paimonialneeds'
        }
      });

      var generator = require('generate-password');
 
var password = generator.generate({
    length: 10,
    numbers: true
});
      var mailOptions = {
        from: 'teampaimon@gmail.com',
        to: req.body.email,
        subject: 'your new password',
        text: "Your new password is: "+password
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      User.findOne({email:req.body.email},function(err,sanitizedUser){
        if (sanitizedUser){
            sanitizedUser.setPassword(password, function(){
                sanitizedUser.save();
                res.status(200).json({message: 'Password reset successful.Check email for your new password and login again'});
            });
        } else {
            res.status(500).json({message: 'This user does not exist'});
        }
      })
})

app.post("/login",function(req,res){
    var username=req.body.username;
    var isEmail=validator.isEmail(username);
    if(isEmail){
        User.findOne({email:username},function(err,profile){
            if(err){
                console.log(err)
            }
            else{
                const user=new User({
                    username:profile.username,
                    passwrod:req.body.password
                });
                req.login(user,function(err){
                    if(err){
                        console.log(err)
                    }else{
                        passport.authenticate("local")(req,res,function(){
                            res.redirect("/home")
                        })
                    }
                })
            }
        })
    }else{
        const user=new User({
            username:req.body.username,
            passwrod:req.body.password
        });
        req.login(user,function(err){
            if(err){
                console.log(err)
            }else{
                passport.authenticate("local")(req,res,function(){
                    res.redirect("/home")
                })
            }
        })
    }
})
app.post("/logout",function(req,res){
    req.logout();
    res.redirect("/login");
})

app.listen("3000",function(err){
    if(err){
        console.log(err)
    }else{
        console.log("server started")
    }
})