const mongoose = require("mongoose") ; 

const groupSchema = mongoose.Schema({
    image : {
        type : String , 
    },
    name : {
        type : String , 
        require : true , 
    },
    participants : [
        {
            type : mongoose.Schema.Types.ObjectId,   
            ref:"users"
        }
    ], 
    admin : {
                type : mongoose.Schema.Types.ObjectId,   // only create one admin easy to manage and implement 
                ref:"users"
            },
    blocked_members : [
        {
            type : mongoose.Schema.Types.ObjectId,   
            ref:"users"
        }
    ]

});

const groupModel = mongoose.model("groups", groupSchema) ; 
module.exports = groupModel ; 