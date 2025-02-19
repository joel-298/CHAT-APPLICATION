const mongoose = require("mongoose") ; 

const url = process.env.MONGODB_URL ; 
mongoose.connect(url) 
.then(()=> {
    console.log("Mongodb connected") ; 
}).catch((err)=>{
    console.log("error connecting mongodb : "+err) ; 
})