const express = require("express") ; 
require('dotenv').config() ; 
require('./models/connection') ; 
const app = express() ; 
const cors = require("cors") ; 
const cookieParser = require("cookie-parser") ; 
const auth = require("./routes/auth");
const user = require("./routes/users");
const message = require("./routes/messages");
// SERVER : 
const {Server} = require("socket.io") ; 
const {createServer} = require("http") ; 
const chatModel = require("./models/chatsModel");
const messageModel = require("./models/messageModel");
const friendsModel = require("./models/friendsModel");

app.use(express.urlencoded({extended:false})) ; 
app.use(express.json()) ; 
app.use(cookieParser()) ;
app.use(cors({
    origin : 'http://localhost:5173',
    credentials : true
})) ;
app.use('/auth',auth) ; 
app.use('/user',user) ; 
app.use('/messages',message) ; 

// ASEND MESSAGE
const addMessageToDb = async (data) => {
    const {userdetails , friend_data , message} = data ; 
    try {
        let chat = await chatModel.findOne({
            $or: [
                { senderId: userdetails._id, receiverId: friend_data._id },
                { senderId: friend_data._id, receiverId: userdetails._id }
            ]
        });
        
        if(!chat) {
            chat = await chatModel.create({
                senderId : userdetails._id , 
                receiverId : friend_data._id
            }) ; 
            console.log('New chat created:', chat._id);
        }
        else{
            console.log("Existing chat id",chat._id) ; 
        }
        const newMessage = await messageModel.create({
            chatId : chat._id ,
            senderId: userdetails._id ,
            text : message
        }) ; 

        // update the last message : 
        chat.lastMessageId = newMessage._id ; 
        await chat.save() ; 

        // console.log('Message saved successfully:', newMessage);
    } catch (error) {
        console.log("Error while stroing message in db !") ; 
    }
};

// SEND REQUEST : 
const sendRequest = async (data) => {
    const {friend_id,user_id} = data ; 
    try {
        let object_user = await friendsModel.findOne({user_id:user_id})          
        .populate('SentRequest', "name image email") ;
        let object_friend = await friendsModel.findOne({user_id:friend_id})
        .populate('ReceiveRequest', "name image email") ;

        if(!object_user || !object_friend) {
            return {boolean : false} ; 
        }
        else{
            object_user.SentRequest.push(friend_id) ; 
            object_friend.ReceiveRequest.push(user_id) ; 
            console.log("USER DATA" , object_user.SentRequest) ; 
            console.log("FRIEND DATA" , object_friend.ReceiveRequest) ; 
            await object_user.save() ; 
            await object_friend.save() ; 

            // **Re-fetch the updated objects with populated references**
            object_user = await friendsModel.findOne({ user_id: user_id })
                .populate('SentRequest', "name image email"); // Populate full user data
            object_friend = await friendsModel.findOne({ user_id: friend_id })
                .populate('ReceiveRequest', "name image email");

            return {boolean : true , userData : object_user , friendData : object_friend } ; 
        }
    } catch (error) {
        console.log("Error while sending request" , error) ; 
        return {boolean : false } ; 
    }
};



const server = createServer(app) ; 
const io = new Server(server,{
    cors : {
        origin: "*" ,
        methods : ["GET","POST","PUT","PATCH","DELETE"]
    }
});
const userSocketMap = {} // {userId,socketId} 
io.on("connection",(socket)=>{
    console.log("User connected",socket.id) ; 

    // CREATE USER : SOCKET MAP
    socket.on("user_online", (userId) => {
        userSocketMap[userId] = socket.id ; 
        io.emit("update_users", userSocketMap) ; 
    });


    // SEND AND RECEIVE MESSAGE  
    socket.on("message",(data) => { //data => {friendSocketId,friend_data,message,userDetails} // userDetails=> {_id,name,etc...} , friend_data => {_id,name,etc .....}
        console.log(data.friendSocketId , data.friend_data._id, data.message , data.userdetails._id) ; 
        if(data.friendSocketId != "") {
            addMessageToDb(data) ; 
            io.to(data.friendSocketId).emit("receive_messages",data) ; 
        }
        else{
            addMessageToDb(data) ; 
            // when the user will get online he is going to fetch data 
        }
    });

    // SEND REQUEST 
    socket.on("addRequest", async (data) => { // friend_id , user_id , userSocketId , friendSocketId
        console.log(`Send Request to : ${data.friend_id} , from : ${data.user_id}`) ; 
        if(data.friendSocketId != null) {
            const obj = await sendRequest(data) ; // return object containing boolean and data.user_id sentRequests and data.friend_id receiveRequests
            if(obj.boolean) {
                console.log("Emitting in real time");
                // emit to friend id receiveRequests
                io.to(data.friendSocketId).emit("receive_request",obj.friendData.ReceiveRequest)  ; 
                io.to(data.userSocketId).emit("send_request",obj.userData.SentRequest) ; 
                // emit to user id sentRequestArray
            }
            else{
                // do not emit !
            }
        }
        else{
            // friend is offline just directly append it to database 
            const obj = await sendRequest(data) ;
            if(obj.boolean) {
                io.to(data.userSocketId).emit("send_request",obj.userData.SentRequest) ;
            }
            else{
                // do not emit
            }
        }

    }) ;

    // ACCEPT 
    socket.on("Accept", (data) => {
        
    });

    // DISCONNECT
    socket.on("disconnect", () => {
        const userId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id) ; // find userId
        if(userId) {
            delete userSocketMap[userId] ;
            io.emit("update_users", userSocketMap) ; 
        }
        console.log("User Disconnected", socket.id) ; 
    });
});



const PORT = 4000 ; 
server.listen(PORT,(err)=>{
    if(err) console.log(err) ; 
    else {
        console.log(`SERVER RUNNING ON PORT : ${4000}`);
    }
}); 