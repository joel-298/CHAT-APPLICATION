const express = require("express") ; 
const protectedRoute = require("../middleware/protectedRoute");
const chatModel = require("../models/chatsModel");
const messageModel = require("../models/messageModel");
const message = express.Router() ; 




// CHATS : 
message.post("/get", protectedRoute ,async (req,res)=>{ // PROTECTED ROUTE ELSE RETURN TO AUTH PAGE
    const {user_id,friend_id} = req.body ; 
    
    console.log(friend_id ," ", user_id) ;
    // Convert IDs to ObjectId to match MongoDB format

    try {
        // let chatID = {};
        let chatId = await chatModel.findOne({participants : {$all: [user_id,friend_id]}}) ; // this is not working correctly 
        console.log(chatId) ; 
        if(!chatId) {
            res.json({boolean : true , message: "No chats present here !" , array : []}) ; 
        } 
        else{
            // find messages array 
            try {
                let array = await messageModel.find({chatId : chatId}) ; 
                // console.log(array) ; 
                if(!array) {
                    res.json({boolean : true , message : "No messages present here !", array : []}) ;
                }
                else{
                    // console.log(array) ;
                    res.json({boolean: true , message : "Messages found !", array : array}) ; 
                }
            } catch (error) {
                console.log("Server Error while loading messages") ;
                res.json({boolean : true, message : "Internal Server Error while loading messages" , array: []})
            }
        }
    } catch (error) {
        console.log("Server Error while loading chatID") ;
        res.json({boolean : true, message : "InternalServer Error while loading chatsID !" , array : []}) ; 
    }
});


// HERE I HAVE WRITTEN TRUE BECAUSE IN FRONTEND IF BOOLEAN VALUE OF RESPONSE == FALSE i.e not authorized because of the 
// possibility of protected route returning false heretherefore return to home page


module.exports = message ; 