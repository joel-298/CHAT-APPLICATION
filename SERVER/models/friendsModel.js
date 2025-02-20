const mongoose = require("mongoose") ; 

const friendsSchema = mongoose.Schema({ 
    user_id : {
        type : mongoose.Schema.Types.ObjectId , 
        require : true , 
        ref : "users"
    } , 
    // one-to-many relationship
    contacts:[{
        type : mongoose.Schema.Types.ObjectId,   // Each objectId is unique identifier for a document in another collection
        ref:"users"}]                           // ref : tells mongoose that objectId values refers to documents in user collection
    ,
    requestedQueue:[{
        type : mongoose.Schema.Types.ObjectId , 
        ref : "users"
    }],
    blockedQueue:[{
        type : mongoose.Schema.Types.ObjectId , 
        ref : "users" 
    }],
});

const friendsModel = mongoose.model("friends",friendsSchema);
module.exports = friendsModel ;