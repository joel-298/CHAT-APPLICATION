const mongoose = require("mongoose") ; 


const chatSchema = mongoose.Schema({
    participants : [{
        type: mongoose.Schema.Types.ObjectId , 
        ref : "users"
    }],
    lastMessageId : {
        type: mongoose.Schema.Types.ObjectId , 
        ref: "messages"
    },
    createdAt : {
        type : Date,
        default : Date.now
    }
});

const chatModel = mongoose.model("chats",chatSchema);
module.exports = chatModel ;