const mongoose = require("mongoose") ; 
const userSchema = mongoose.Schema({
    image : {
        type : String,  
        require: true
    },
    name : {
        type : String,
        require: true,
    },
    email:{
        type :String,
        require:true,
        unique:true
    },
    password : {
        type : String ,
        require: true ,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const userModel = mongoose.model("users",userSchema) ; 
module.exports = userModel ; 