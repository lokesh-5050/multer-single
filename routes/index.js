var express = require("express");
var router = express.Router();
const userModel = require("./users");
const imageModel = require('./uploads')
const Passport = require("passport");
const localStrategy = require("passport-local");
const users = require("./users");
const multer = require('multer')
const path =  require('path')
const flash = require('connect-flash')

const storage = multer.diskStorage({
  destination:(req,file,cb) =>{
    cb(null , './public/viaMulter');
  },
  filename:(req,file,cb) =>{
    cb(null, Date.now() +  path.extname(file.originalname))
  }
})

const upload = multer({
  storage:storage,
  fileFilter:(req,file,cb)=>{
    if(file.mimetype === "jpg" || "jpeg" || "png"){
      return cb(null , true)
    }else{
      return cb(new Error("This fileFormat is not allowed"))
      cb(null, false)
    }
  }
})

const GOOGLE_CLIENT_ID = "184644567601-712m204ljidhmliomk42a9deq45h7i4k.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";
const findOrCreate = require("mongoose-findorcreate");
const { Error } = require("mongoose");




//google -aouth2.0
var GoogleStrategy = require("passport-google-oauth2").Strategy;

Passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
      userModel.findOrCreate({ username: profile.email , name:profile.displayName}, function (err, user) {
        console.log(user);
        return done(err, user);
      });
    }
  )
);

router.get(
  "/auth/google",
  Passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/auth/google/callback",
  Passport.authenticate("google", {
    successRedirect: "/indexOfProfile",
    failureRedirect: "/",
  })
);

// router.get('/ok' , (req,res)=>{
//   res.send("google aunthentication is working")
// })

Passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get("/", checkIsLoggedIn, function (req, res, next) {
  res.render("index");
});

router.post("/create", function (req, res, next) {
  const newUser = new userModel({
    username: req.body.username,
    name: req.body.name,
  });
  userModel.register(newUser, req.body.password).then(function () {
    Passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

router.get("/profile", isLoggedIn, function (req, res, next) {
  userModel.find().then(function (users) {
    res.render("profile", { users });
  });
});

//middleware function
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/");
  }
}

router.post(
  "/login",
  Passport.authenticate("local", {
    successRedirect: `/indexOfProfile`,
    failureRedirect: "/",
  })
);

router.get("/indexOfProfile", isLoggedIn, function (req, res, next) {
  userModel.findOne({ username: req.user.username })
  .then(function (userInfo) {
    console.log(userInfo)
    res.render("indexOfProfile", { hi: userInfo });
  });
});

router.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) throw err;
    res.redirect("/");
  });
});

//function for checkIsLoggedIn
function checkIsLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect("/indexOfProfile");
  } else {
    return next();
  }
}


//Multer API
router.post("/uploads", upload.single('photos'), function (req, res) {
 var imageDets = new imageModel({
  imageName:req.file.filename
 })
//  .save(function(err,data){
//   if(err) throw err;
//   imageModel.find()
//   .exec(function(err,data){
//     console.log(data);
//     res.render('uploadedFiles' , {allFiles:data})
//   })
//  })
.save((err,data)=>{
  if(err) throw err
  // console.log(data);
  imageModel.find({}).exec((err,files)=>{
    console.log(files);
    if(err) throw err
    res.render('uploadedFiles' , {allFiles:files})
  })
})
  
});

router.get("/uploads", function (req, res) {

   imageModel.find({}).exec((err,files)=>{
    console.log(files);
    if(err) throw err
    res.render('uploadedFiles' , {allFiles:files})
  })
});

router.get("/delete/:id", function (req, res) {
  imageModel.findOneAndDelete({_id:req.params.id})
  .then(function(deletedFile){
    // res.send(deletedFile)
    res.redirect('back')
  })
  
});







module.exports = router;
