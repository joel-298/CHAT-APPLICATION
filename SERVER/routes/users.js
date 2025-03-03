const express = require("express") ; 
const userModel = require("../models/userModel");
const protectedRoute = require("../middleware/protectedRoute");
const friendsModel = require("../models/friendsModel");
const groupModel = require("../models/groupModel");
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

// USER CONTACTS 
user.get("/contacts" , protectedRoute  , async (req,res) => { // PROTECTED ROUTE ELSE RETURN TO AUTH PAGE 
    const id = req.user._id ; 
    console.log("USER CONTACTS ID",id) ; 
    try {
        const friendData = await friendsModel
          .findOne({ user_id: id })
          .populate('contacts', "name image email")
          .populate('SentRequest', "name image email")
          .populate('ReceiveRequest', "name image email")
          .populate('BlockedContacts', "name image email")
          .populate('BlockedBy', "name image email")
          .populate("Groups", "name image participants admin blocked_members") ; 
    
        if (friendData) {
          return res.json({
            boolean: true,
            contacts: friendData.contacts,
            SentRequest: friendData.SentRequest,
            ReceiveRequest: friendData.ReceiveRequest,
            BlockedContacts: friendData.BlockedContacts,
            BlockedBy: friendData.BlockedBy,
            Groups: friendData.Groups
          });
        } else {
          return res.json({
            boolean: true,
            message: "Array of contacts not found",
            contacts: [],
            SentRequest: [],
            ReceiveRequest: [],
            BlockedContacts: [],
            BlockedBy: [],
            Groups: []
          });
        }
      } catch (error) {
        console.log(error);
        return res.json({
          boolean: true,
          message: "Internal Server Error",
          contacts: [],
          SentRequest: [],
          ReceiveRequest: [],
          BlockedContacts: [],
          BlockedBy: [],
          Groups: []
        });
      }
});

user.post("/participants", protectedRoute , async (req,res) => {
  const {selectedGroupId} = req.body ; 
  console.log("SELECTED GROUP ID ",req.body.selectedGroupId) ; 
  try {
    const obj = await groupModel.findOne({_id: selectedGroupId}).populate("participants", "name image");
    if(obj) {
      console.log(obj) ; 
      res.json({boolean:true, obj : obj}) ; 
    } 
    else{
      console.log("Object not found !") ; 
      res.json({boolean : false});  
    }

  } catch (error) { 
    console.log("Error while fetching participants !") ; 
    res.json({boolean:false}) ; 
  }
}); 


module.exports = user ; 



// POPULATE METHOD IN MONGO DB ACTS AS SQL JOIN REDUCING DATA DUBLICATION
// By default, Mongoose includes the _id field when you populate, even if you don’t explicitly list it