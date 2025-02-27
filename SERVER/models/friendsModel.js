const mongoose = require("mongoose") ; 

const friendsSchema = mongoose.Schema({ 
    user_id : {
        type : mongoose.Schema.Types.ObjectId , 
        require : true , 
        ref : "users"
    } , 
    // one-to-many relationship
    contacts:[{
        type : mongoose.Schema.Types.ObjectId,   
        ref:"users"}]
    ,
    SentRequest:[{
        type : mongoose.Schema.Types.ObjectId , 
        ref : "users"
    }],
    ReceiveRequest : [{
        type : mongoose.Schema.Types.ObjectId , 
        ref : "users"
    }],
    BlockedContacts:[{
        type : mongoose.Schema.Types.ObjectId , 
        ref : "users" 
    }],
    BlockedBy : [{
        type: mongoose.Schema.Types.ObjectId , 
        ref : "users" 
    }],
    Groups : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "groups"
    }]
});

const friendsModel = mongoose.model("friends",friendsSchema);
module.exports = friendsModel ;