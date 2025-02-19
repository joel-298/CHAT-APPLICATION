const jwt = require("jsonwebtoken") ; 

const protectedRoute = async (req,res,next) => {
    try {
        const token = req.cookies?.authToken ; 
        if(!token) {
            return res.json({boolean : false , message : "Unauthorized ! Please Login !"}) ; 
        }
        // else{ 
            const decode = jwt.verify(token , process.env.JWT_SECRET) ; 
            if(!decode) {
                return res.json({boolean : false , message : "Unauthorized ! Session time out Please login again !"})
            }
            // else{
                req.user = decode ; // it will contain all the decrypted user details
                next() ; 
            // }
        // }
    } catch (error) {
        console.log("Error in protected route",error) ;
        return res.json({boolean:false,message:"Internal Server Error !"}) ;  
    }
};

module.exports = protectedRoute ; 