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

// FRIENDS OF USERS IN DAHBOARD  // CHECK POINT 1 : CONTACTS
// user.post("/contacts" , async (req,res) => { // PROTECTED ROUTE ELSE RETURN TO AUTH PAGE 
//     const input = req.body ; 
//     console.log(input) ; 
//     try {
//         const user = friendsModel.find({user_id : input}) ;
//         console.log(user.contacts) ;  
//         if(user) {
//             return res.json({boolean : true , array : user.contacts}) ; 
//         }
//         else{
//             return res.json({boolean : false , message : "Array of contacts not found"}) ; 
//         }
//     } catch (error) {
//         console.log(error) ;
//         return res.json({boolean : false , message : "Internal Server Error"}) ; 
//     }
// });



module.exports = user ; 