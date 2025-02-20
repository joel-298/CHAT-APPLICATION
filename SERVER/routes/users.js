const express = require("express") ; 
const userModel = require("../models/userModel");
const protectedRoute = require("../middleware/protectedRoute");
const friendsModel = require("../models/friendsModel");
const user = express.Router() ; 

// SEARCH BAR : 
user.get("/search/:input", async (req , res) => {
    const input = req.params.input ;
    try {
        const array = await userModel.find({ name: { $regex: input, $options: 'i' } }) ; // options i makes it case insensitive 
        if (array.length > 0) {
            res.json({ boolean: true, message: "Matches found", array });
        } else {
            res.json({ boolean: false, message: "No match found", array: [] });
        }
    } catch (error) {
        console.log(error) ; 
        res.json({boolean : false , message : "Error while searching for users"}) ; 
    }
});

// GET USER PERSONAL DECODED DATA 
user.get('/personal', protectedRoute , async (req,res) => { // PROTECTED ROUTE ELSE RETURN TO AUTH PAGE
    const user = req.user ; 
    return res.json({boolean : true , message : "Authorized ", user : user}) ; 
});

// FRIENDS OF USERS IN DAHBOARD  
user.get("/contacts" , protectedRoute  , async (req,res) => { // PROTECTED ROUTE ELSE RETURN TO AUTH PAGE 
    const id = req.user._id ; 
    console.log("USER CONTACTS ID",id) ; 
    try {
        const user = friendsModel.find({user_id : id}) ;
        console.log(user.contacts) ;  
        console.log(user.requestedQueue) ; 
        console.log(user.blockedQueue) ; 
        if(user) {
            return res.json({boolean : true , contacts : user.contacts , requestedQueue : user.requestedQueue , blockedQueue : user.blockedQueue }) ; 
        }
        else{
            return res.json({boolean : false , message : "Array of contacts not found" , contacts : [] , requestedQueue : [] , blockedQueue : []}) ; 
        }
    } catch (error) {
        console.log(error) ;
        return res.json({boolean : false , message : "Internal Server Error" , contacts : [] , requestedQueue : [] , blockedQueue : []}) ; 
    }
});



module.exports = user ; 