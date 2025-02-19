const mongoose = require("mongoose") ; 


const messageSchema = mongoose.Schema({
    chatId : {
        type : mongoose.Schema.Types.ObjectId , 
        ref : "chats" , 
        require : true ,
    },
    senderId : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : "users", 
        require : true , 
    },
    text : {
        type : String ,
        require : true , 
    }, 
    createdAt : {
        type: Date,
        default: Date.now
    }
});
const messageModel = mongoose.model("messages",messageSchema) ; 
module.exports = messageModel ; 