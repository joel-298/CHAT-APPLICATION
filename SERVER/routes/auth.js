const express = require("express") ; 
const jwt = require("jsonwebtoken") ; 
const bcrypt = require("bcryptjs") ; 
const userModel = require("../models/userModel");
const friendsModel = require("../models/friendsModel");
const auth = express.Router() ; 

// SIGNUP
auth.post('/signup', async (req , res) => {
    let {image,name,email,password} = req.body ; 

    let data = await (userModel).find({email : email}) ; 
    if(data.length == 0) {
        const newpass = await bcrypt.hash(password.toString(),10) ; 
        const result = await userModel.create({
            image : image,
            name : name , 
            email: email ,
            password : newpass
        }) ; 
        const friendTable = await friendsModel.create({
            user_id : result._id , 
            contacts : [result._id] // and a person to itself contact !
        })
        result.save() ; 
        friendTable.save() ; 
        res.status(201)  ;
        res.json({
            boolean:true,
            message:"Account Created Successfully"
        }) ; 
    }
    else{
        return res.json({
            boolean:false, 
            message:"User already exists please login !"
        }) ; 
    }
});

// LOGIN
auth.post('/login', async (req,res) => {
    let {email,password} = req.body ;
    let user = await userModel.findOne({email : email}) ; 
    if(user) {
        const match = await bcrypt.compare(password,user.password) ; 
        if(match == true) {
            // category user
            const {_id,image,name,email,createdAt} = user ; 
            const token = jwt.sign({_id,image,name,email,createdAt},process.env.JWT_SECRET,{expiresIn:process.env.JWT_TIMEOUT}) ; 
            // create cookie
            res.cookie('authToken',token ,{
                httpOnly : true , 
                secure : true , // true if hosting
                sameSite : 'None' , 
                // SESSION COOKIE !
            }).json({boolean : true , message : "Login Successful !" }) ; 
            return ;
        }
        else{
            res.json({boolean : false , message : "Wrong password !"}) ; 
            return ; 
        }
    }
    // put return statements while sending the response
    res.json({boolean : false , message : "Account not found please signup first !"}) ;    
});

// LOGOUT
auth.get('/logout', (req,res)=> {
    res.clearCookie('authToken', {httpOnly : true ,                 secure : true , // true if hosting
        sameSite : 'None' }) ; 
    res.json({boolean: true , message : "Logged out successfully !"}) ; 
});

// VERIFY
auth.get('/verify', async (req,res)=>{                                         // for Login , Signup , and Home page only !
    try {
        const token = req.cookies.authToken ;                                   // get token present in cookie
        if(!token) { 
            return res.json({boolean : false , message : "Unauthorized !" }) ; 
        }
        else {
            const decode = jwt.verify(token,process.env.JWT_SECRET) ; 
            if(!decode) {
                return res.json({boolean:false,message:"Unauthorized !"}) ; 
            }
            else{
                return res.json({boolean:true,message:"Authorized"}) ;          // user already logged in !
            }
        }
    } catch (error) {
        console.log("Verify token route", error) ; 
        return res.json({boolean : false , message : "Internal server error"})
    }
});
module.exports = auth ; 
