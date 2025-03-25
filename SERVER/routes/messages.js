const express = require("express") ; 
const protectedRoute = require("../middleware/protectedRoute");
const chatModel = require("../models/chatsModel");
const messageModel = require("../models/messageModel");
const groupModel = require("../models/groupModel");
const message = express.Router() ; 
const twilio = require("twilio") ; 




// CHATS : 
message.post("/get", protectedRoute ,async (req,res)=>{ // PROTECTED ROUTE ELSE RETURN TO AUTH PAGE
    const {user_id,friend_id,isGroup} = req.body ; // also receive that is it from group or not if from group then search in groupModel
    
    console.log(friend_id ," ", user_id) ; // if isGroup then friend id will represent the group id
    

    try {
        let chatId = {};
        if(isGroup) { // true 
            chatId = await chatModel.findOne({ receiverId: friend_id });
        }
        else{
            chatId = await chatModel.findOne({
                $or: [
                    { senderId: user_id, receiverId: friend_id },
                    { senderId: friend_id, receiverId: user_id }
                ]
            });
        }
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


message.post("get-ice-candidates", async (req,res) => {
    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = twilio(accountSid, authToken);
        const token = await client.tokens.create();
        console.log(token.accountSid);
        res.json({boolean : true , ICE_CANDIDATES : token.accountSid}) ; 
    } catch (error) {
        console.log("Error while fetching ice candidates : Server error !", error); 
        res.json({boolean : false , message : "Internal Server while fetching ice candidates"}) ; 
    }
}) ; 

module.exports = message ; 