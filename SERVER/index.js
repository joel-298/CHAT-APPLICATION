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

// SEND MESSAGE
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
        let object_user = await friendsModel.findOne({user_id:user_id})  ;        
        let object_friend = await friendsModel.findOne({user_id:friend_id}) ;
        if(!object_user || !object_friend) {
            return {boolean : false} ; 
        }
        else{   
            // check here that the person to whom we are sending the request alreay exists in our sent array also check that is the person exists in our received array
            if(!object_user.SentRequest.includes(friend_id) && !object_user.ReceiveRequest.includes(friend_id)) { // already exists then do not push
                await object_user.SentRequest.push(friend_id) ; 
            }
            if(!object_friend.ReceiveRequest.includes(user_id) && !object_friend.SentRequest.includes(user_id)) { // already exists then do not push
                await object_friend.ReceiveRequest.push(user_id) ; 
            }
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

// ACCEPT REQUEST
const AcceptRequest = async (data) => {
    const {friend_id , user_id} = data ; 
    try {
        let object_user = await friendsModel.findOne({user_id : user_id}) ; 
        let object_friend = await friendsModel.findOne({user_id : friend_id}) ;
        if(!object_user || !object_friend) {
            return {boolean : false} ; 
        }
        else{ 
            const isUserContactExists = object_user.contacts.includes(friend_id) ; 
            if(!isUserContactExists) {
                await object_user.contacts.push(friend_id) ; 
            }
            const isFriendContactExists = object_friend.contacts.includes(user_id) ; 
            if(!isFriendContactExists) {
                await object_friend.contacts.push(user_id) ; 
            }
            object_user.ReceiveRequest = object_user.ReceiveRequest.filter(id => id != friend_id) ; 
            object_friend.SentRequest = object_friend.SentRequest.filter(id => id != user_id) ; 
            await object_user.save() ; 
            await object_friend.save() ; 

            // **Re-fetch the updated objects with populated references**
            object_user = await friendsModel.findOne({user_id : user_id})
            .populate('ReceiveRequest', "name image email")
            .populate('contacts', "name image email");
            object_friend = await friendsModel.findOne({user_id : friend_id})
            .populate('SentRequest', "name image email")
            .populate('contacts', "name email image") ;  
            return {boolean : true , userData : object_user , friendData : object_friend} ; 
        }  
    } catch (error) {
        console.log("Error while Accepting request" , error) ; 
        return {boolean : false } ; 
    }
};

// REJECT REQUEST 
const RejectRequest = async (data) => {
    const {friend_id , user_id} = data ; 
    try {
        let object_user = await friendsModel.findOne({user_id : user_id}) ; 
        let object_friend = await friendsModel.findOne({user_id : friend_id}) ; 
        if(!object_user || !object_friend) {
            return {boolean : false} ; 
        }
        else {
            object_user.ReceiveRequest = object_user.ReceiveRequest.filter(id => id != friend_id) ; 
            object_friend.SentRequest = object_user.SentRequest.filter(id => id !== user_id);
            await object_user.save() ; 
            await object_friend.save() ; 

            // **Re-fetch the updated objects with populated references**
            object_user = await friendsModel.findOne({user_id : user_id})
            .populate("ReceiveRequest", "name image email") ; 
            object_friend = await friendsModel.findOne({user_id : friend_id}) 
            .populate("SentRequest", "name image email") ; 
            return {boolean : true , userData : object_user , friendData : object_friend }
        }
    } catch (error) {
        console.log("Error while Rejecting request" , error) ; 
        return {boolean : false } ;  
    }
};

// UNFOLLOW 
const  UnfollowRequest = async (data) => {
    const {friend_id , user_id} = data ; 
    try {
        let object_user = await friendsModel.findOne({user_id : user_id}) ; 
        let object_friend = await friendsModel.findOne({user_id : friend_id}) ; 
        if(!object_user || !object_friend) {
            return {boolean : false} ; 
        }
        else {
            object_user.contacts = object_user.contacts.filter(id => id != friend_id) ; 
            object_friend.contacts = object_friend.contacts.filter(id => id != user_id);
            await object_user.save() ; 
            await object_friend.save() ; 

            // **Re-fetch the updated objects with populated references**
            object_user = await friendsModel.findOne({user_id : user_id})
            .populate("contacts", "name image email") ; 
            object_friend = await friendsModel.findOne({user_id : friend_id}) 
            .populate("contacts", "name image email") ; 
            return {boolean : true , userData : object_user , friendData : object_friend }
        }
    } catch (error) {
        console.log("Error while Rejecting request" , error) ; 
        return {boolean : false } ;  
    }
};

// CANCEL REQUEST
const CancelRequest = async (data) => {
    const {friend_id , user_id} = data ; 
    try {
        let object_user = await friendsModel.findOne({user_id : user_id}) ; 
        let object_friend = await friendsModel.findOne({user_id : friend_id}) ; 
        if(!object_user || !object_friend) {
            return {boolean : false} ; 
        }
        else {
            object_user.SentRequest = object_user.SentRequest.filter(id => id != friend_id) ; 
            object_friend.ReceiveRequest = object_friend.ReceiveRequest.filter(id => id != user_id);
            await object_user.save() ; 
            await object_friend.save() ; 

            // **Re-fetch the updated objects with populated references**
            object_user = await friendsModel.findOne({user_id : user_id})
            .populate("SentRequest", "name image email") ; 
            object_friend = await friendsModel.findOne({user_id : friend_id}) 
            .populate("ReceiveRequest", "name image email") ; 
            return {boolean : true , userData : object_user , friendData : object_friend }
        }
    } catch (error) {
        console.log("Error while Rejecting request" , error) ; 
        return {boolean : false } ;  
    }
};

// BLOCK REQUEST 
const BlockRequest = async (data) => {
    const {friend_id , user_id} = data ; 
    try {
        let object_user = await friendsModel.findOne({user_id : user_id}) ; 
        let object_friend = await friendsModel.findOne({user_id : friend_id}) ; 
        if(!object_user || !object_friend) {
            return {boolean : false} ; 
        }
        else {
            const isBlockedContactExists = object_user.BlockedContacts.includes(friend_id) ; 
            if(!isBlockedContactExists) {
                await object_user.BlockedContacts.push(friend_id) ;
            }
            const isBlockedByContactExists = object_friend.BlockedBy.includes(user_id) ; 
            if(!isBlockedByContactExists) {
                await object_friend.BlockedBy.push(user_id);
            }
            await object_user.save() ; 
            await object_friend.save() ; 

            // **Re-fetch the updated objects with populated references**
            object_user = await friendsModel.findOne({user_id : user_id})
            .populate("BlockedContacts", "name image email") ; 
            object_friend = await friendsModel.findOne({user_id : friend_id}) 
            .populate("BlockedBy", "name image email") ; 
            return {boolean : true , userData : object_user , friendData : object_friend }
        }
    } catch (error) {
        console.log("Error while Rejecting request" , error) ; 
        return {boolean : false } ;  
    }
};

// UNBLOCK REQUEST 
const UnBlockRequest = async (data) => {
    const {friend_id , user_id} = data ; 
    try {
        let object_user = await friendsModel.findOne({user_id : user_id}) ; 
        let object_friend = await friendsModel.findOne({user_id : friend_id}) ; 
        if(!object_user || !object_friend) {
            return {boolean : false} ; 
        }
        else {
            object_user.BlockedContacts = object_user.BlockedContacts.filter(id => id != friend_id) ; 
            object_friend.BlockedBy = object_friend.BlockedBy.filter(id => id != user_id);
            await object_user.save() ; 
            await object_friend.save() ; 

            // **Re-fetch the updated objects with populated references**
            object_user = await friendsModel.findOne({user_id : user_id})
            .populate("BlockedContacts", "name image email") ; 
            object_friend = await friendsModel.findOne({user_id : friend_id}) 
            .populate("BlockedBy", "name image email") ; 
            return {boolean : true , userData : object_user , friendData : object_friend }
        }
    } catch (error) {
        console.log("Error while Rejecting request" , error) ; 
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
            const obj = await sendRequest(data) ; // return object containing {boolean} and {data.user_id sentRequests} and {data.friend_id receiveRequests}
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
            // friend is offline just directly append it to database , and emit those in which user is online
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
    socket.on("Accept", async (data) => {
        console.log(`Accept Request From : ${data.friend_id} By : ${data.user_id}` ) ; 
        if(data.friendSocketId != null) {
            const obj = await AcceptRequest(data) ; // return object containing {boolean} , {data.user_id : Contacts , Receive Request} , {data.friend_id : SendRequest , Contacts} 
            if(obj.boolean) {
                io.to(data.userSocketId).emit("accept_request", { contacts : obj.userData.contacts , receive : obj.userData.ReceiveRequest} ) ; 
                io.to(data.friendSocketId).emit("accepted_by_request", {contacts : obj.friendData.contacts , sent : obj.friendData.SentRequest}) ; 
            }
            else{
                // do not emit
            }
        }
        else{
            // friend is offline just directly append it to database , and emit those in which user is online
            const obj = await AcceptRequest(data) ;
            if(obj.boolean) {
                io.to(data.userSocketId).emit("accept_request", { contacts : obj.userData.contacts , receive : obj.userData.ReceiveRequest} ) ; 
            }  
            else{
                // do not emit
            }
        }
    });

    // REJECT 
    socket.on("Reject" , async (data) => {
        console.log(`Reject Request From : ${data.user_id} To : ${data.friend_id} `) ; 
        if(data.friendSocketId != null) {
            const obj = await RejectRequest(data) ;  // return object containing {boolean} , {data.user_id : Receive Request} , {data.friend_id : SendRequest} 
            if(obj.boolean) {
                io.to(data.userSocketId).emit("reject_request",obj.userData.ReceiveRequest) ; 
                io.to(data.friendSocketId).emit("rejected_by_request",obj.friendData.SentRequest)
            }
            else{
                // do not emit 
            }
        }
        else{
            // friend is offline just directly append it to database , and emit those in which user is online
            const obj = await RejectRequest(data) ;  
            if(obj.boolean) {
                io.to(data.userSocketId).emit("reject_request",obj.userData.ReceiveRequest) ; 
            }
            else{
                // do not emit 
            }
        }
    });

    // UNFOLLOW 
    socket.on("Unfollow", async (data) => {
        console.log(`Unfollow Request From : ${data.user_id} To : ${data.friend_id} `) ; 
        if(data.friendSocketId != null) {
            const obj = await UnfollowRequest(data) ;  // return object containing {boolean} , {data.user_id : contacts } , {data.friend_id : contacts } 
            if(obj.boolean) {
                io.to(data.userSocketId).emit("unfollow_request",obj.userData.contacts) ; 
                io.to(data.friendSocketId).emit("unfollowed_by_request",obj.friendData.contacts)
            }
            else{
                // do not emit 
            }
        }
        else{
            // friend is offline just directly append it to database , and emit those in which user is online
            const obj = await UnfollowRequest(data) ;  
            if(obj.boolean) {
                io.to(data.userSocketId).emit("unfollow_request",obj.userData.contacts) ; 
            }
            else{
                // do not emit 
            }
        }
    });

    // CANCEL REQUEST 
    socket.on("CancelRequest", async (data) => {
        console.log(`Cancel Request From : ${data.user_id} To : ${data.friend_id} `) ; 
        if(data.friendSocketId != null) {
            const obj = await CancelRequest(data) ;  // return object containing {boolean} , {data.user_id : contacts } , {data.friend_id : contacts } 
            if(obj.boolean) {
                io.to(data.userSocketId).emit("cancel_request",obj.userData.SentRequest) ; 
                io.to(data.friendSocketId).emit("cancelled_by_request",obj.friendData.ReceiveRequest)
            }
            else{
                // do not emit 
            }
        }
        else{
            // friend is offline just directly append it to database , and emit those in which user is online
            const obj = await CancelRequest(data) ;  
            if(obj.boolean) {
                io.to(data.userSocketId).emit("cancel_request",obj.userData.SentRequest) ; 
            }
            else{
                // do not emit 
            }
        }
    });

    // BLOCK 
    socket.on("Block", async (data) => {
        console.log(`Block Request From : ${data.user_id} To : ${data.friend_id} `) ; 
        if(data.friendSocketId != null) {
            const obj = await BlockRequest(data) ;  // return object containing {boolean} , {data.user_id : BlockedContacts } , {data.friend_id : BlockedBy } 
            if(obj.boolean) {
                io.to(data.userSocketId).emit("block_request",obj.userData.BlockedContacts) ; 
                io.to(data.friendSocketId).emit("blocked_by_request",obj.friendData.BlockedBy)
            }
            else{
                // do not emit 
            }
        }
        else{
            // friend is offline just directly append it to database , and emit those in which user is online
            const obj = await BlockRequest(data) ;  
            if(obj.boolean) {
                io.to(data.userSocketId).emit("block_request",obj.userData.BlockedContacts) ; 
            }
            else{
                // do not emit 
            }
        }      
    });
    
    // UNBLOCK 
    socket.on("Unblock", async (data) => {
        console.log(`UnBlock Request From : ${data.user_id} To : ${data.friend_id} `) ; 
        if(data.friendSocketId != null) {
            const obj = await UnBlockRequest(data) ;  // return object containing {boolean} , {data.user_id : BlockedContacts } , {data.friend_id : BlockedBy } 
            if(obj.boolean) {
                io.to(data.userSocketId).emit("unblock_request",obj.userData.BlockedContacts) ; 
                io.to(data.friendSocketId).emit("unblocked_by_request",obj.friendData.BlockedBy)
            }
            else{
                // do not emit 
            }
        }
        else{
            // friend is offline just directly append it to database , and emit those in which user is online
            const obj = await UnBlockRequest(data) ;  
            if(obj.boolean) {
                io.to(data.userSocketId).emit("unblock_request",obj.userData.BlockedContacts) ; 
            }
            else{
                // do not emit 
            }
        }      
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



// what will happen when we do not emit db entries will not work 
// only the user will get changes in its ui but in the whole logic in backend because  
// some error occured while saving in backend !