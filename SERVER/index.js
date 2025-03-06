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
const { default: mongoose } = require("mongoose");
const groupModel = require("./models/groupModel");
const userModel = require("./models/userModel");

app.use(express.urlencoded({extended:false})) ; 
app.use(express.json()) ; 
app.use(cookieParser()) ;
app.use(cors({
    origin : 'https://chat-application-beta-tan-81.vercel.app',
    credentials : true,
    methods: ["GET", "POST"],
})) ;
app.use('/auth',auth) ; 
app.use('/user',user) ; 
app.use('/messages',message) ; 

// SEND MESSAGE
const addMessageToDb = async (data) => {
    const {userdetails , friend_data , message , isGroup ,senderImage} = data ; 
    try {
        let chat = {} 
        if(isGroup) { // if its a group
            console.log("Group selected and its id ", friend_data._id) ; 
            chat = await chatModel.findOne({ receiverId: friend_data._id });
        }
        else {
            chat = await chatModel.findOne({
                $or: [
                    { senderId: userdetails._id, receiverId: friend_data._id },
                    { senderId: friend_data._id, receiverId: userdetails._id }
                ]
            });
        }
        
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
            text : message,
            image : senderImage
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


// CREATE GROUP  
const Create_Group = async (data) => {  // {admin , filteredMembers , creatingGroupName}
    const {admin , filteredMembers , creatingGroupName} = data ; 
    try {
        const newGroup = await groupModel.create({
            image : "https://cdn-icons-png.flaticon.com/512/8443/8443368.png",
            name : creatingGroupName , 
            admin : admin , 
            participants : filteredMembers ,
            blocked_members : []
        }) ; 
        await newGroup.save() ; 
        for(let i = 0 ; i < filteredMembers.length ; i++) { // also append the group id to all the members !
            const member_obj = await friendsModel.findOne({user_id : filteredMembers[i]}) ; 
            if(member_obj) { // i.e object found
                member_obj.Groups.push(newGroup._id) ; 
            }
            await member_obj.save() ; 
        }

        return {boolean : true , newGroup} ; 
    } catch (error) {
        console.log("Error while saving the group !") ; 
        return {boolean : false }
    }
};

const DeleteGroup = async (data) => { // {id,selectedGroupId,participants:} // we also need to participants 
    // delete group from groups schema 
    // remove its chats schema 
    // make a loop on participants and 
    // in participants.Groups remove the previously group id too 
    const {id,selectedGroupId,participants} = data ; 
    try {
        const group = await groupModel.findOneAndDelete({_id : selectedGroupId}) ; 
        if(group) {
            const chat = await chatModel.findOneAndDelete({receiverId : selectedGroupId}) ; 
            if(chat) {
                await messageModel.deleteMany({chatId : chat._id}) ; 
            }
            return {boolean : true} ; 
        }
        else{
            console.log("Group not found !") ; 
            return {boolean : false} ; 
        }
    } catch (error) {
        console.log("Error while deleting Group , and its chat Id and their messages !", error) ; 
        return {boolean : false} ; // return false because then the parent function will not return anything .... 
    }
}

// UPDATE GROUPS COLLECTION OF USERS FROM FRIENDS MODEL 
const UpdatedGroups = async (data) => { // {user_id , selectedGroupId}
    const {user_id , selectedGroupId} = data ; 
    try {
        const obj = await friendsModel.findOne({user_id : user_id }) ; // find participants in friendmodel 
        if(obj) {
            obj.Groups = obj.Groups.filter((ele)=> ele != selectedGroupId) ;
            await obj.save() ; 


            // after filter populate and return 
            const updatedFriendData = await friendsModel.findOne({user_id : user_id}).populate("Groups", "name image participants admin blocked_members") ;
            return {boolean : true , Groups : updatedFriendData.Groups} ;   
        }
        else{
            console.log("User account not found !") ; 
            return {boolean : false} ; 
        }
    } catch (error) {
        console.log("Error while leaving group !",error) ; 
        return {boolean : false} ; 
    }

}
const Leave_Group = async (data) => {
    const {userdetails,selectedGroupId} = data ; 
    try {
        const group = await groupModel.findOne({_id : selectedGroupId}) ; 
        if(group) {
            // remove user from the group participants 
            group.participants = group.participants.filter((id) => id != userdetails._id) ; 
            console.log("Group Participants !",group.participants) ; 

            // remove the group from users friendModel Group array 
            const user = await friendsModel.findOne({user_id : userdetails._id}) ; 
            if(user) {
                user.Groups = user.Groups.filter((id) => id != selectedGroupId) ; 
                await user.save() ; 
            }

            await group.save() ; 
            console.log("RETURNING TRUE") ; // printing true 
            return {boolean : true } ; // but sending undefined rest everything is workin !
        }   
    } catch (error) {
        console.log("Error while leaving the group !") ; 
        return {boolean : false} ; 
    }
};

const leave_updated_group = async (id) => {             // IGNORE THE NAME : BASICALLY THIS FUNCTION IS FETCHING USER'S GROUPS ARRAY OF FRIENDS MODEL
    try {
        console.log(id)  ;
        const user = await friendsModel.findOne({user_id : id}).populate("Groups", "name image participants admin blocked_members") ; 
        if(user) {
            console.log("Groups_leave : ", user.Groups) ; 
            return {boolean : true , groups : user.Groups} ; 
        }
    } catch (error) {
        console.log("Error in leaving updated group !") ; 
        return {boolean : false} ; 
    }
}


const AddOrRemoveMembers = async ({GroupId, updatedParticipants, members}) => { // NOTE : members : array of strings , updatedParticipants : array of objects
    console.log("ADDING OR REMOVING MEMBRES :,\n PREVIOUS MEMBERS ",members," \n NEW MEMBERS : ",updatedParticipants) ; 
    // update the group in here for now 

    try {
        const group = await groupModel.findOne({_id : GroupId}) ; 
        if(group) {
            // Step 1: Identify members to remove
            const membersToRemove = group.participants.filter(
                (memberId) => !updatedParticipants.some((participant) => participant._id == memberId)
            );
            console.log("Members to Remove:", membersToRemove);

            // Step 2: Identify members to add
            const membersToAdd = updatedParticipants.filter(
                (participant) => !group.participants.some((memberId) => memberId == participant._id)
            );
            console.log("Members to Add:", membersToAdd); // NOTE : array of object !

    
            // STEP 3 : UPDATE THE GROUP ARRAY 
            group.participants = [] ; 
            for(let i = 0 ; i < updatedParticipants.length ; i++) {
                group.participants.push(updatedParticipants[i]._id) ; // note update participants is an array of object 
            }
            await group.save() ; 

            // STEP 4 : REMOVE THIS GROUP ID FROM THE ARRAY OF MEMBERS TO REMOVE
            for(let i = 0 ; i < membersToRemove.length ; i++) {
                const user = await friendsModel.findOne({user_id : membersToRemove[i]}) ; 
                if(user) {
                    user.Groups = user.Groups.filter((id) => id != GroupId) ;  // remove this group id 
                    await user.save() ; 
                }
            }
            // STEP 5 : APPEND THIS GROUP ID TO THE GROUP ARRAY OF NEW USERS 
            for(let i = 0 ; i < membersToAdd.length ; i++) {
                const user = await friendsModel.findOne({user_id : membersToAdd[i]._id}) ; 
                if(user) {
                    user.Groups.push(GroupId) ; // append a new group id 
                    await user.save() ; 
                }

            }

            return {boolean : true , group : group } ; 

        }
        else{
            console.log("Group Not found for adding or removing members !") ; 
        }
    } catch (error) {
        console.log("Error while Adding or remoing participants from the Groups !",error) ; 
    }
    return {boolean : true };
};

 
const server = createServer(app) ; 
const io = new Server(server,{
    cors : {
        origin: "https://chat-application-beta-tan-81.vercel.app" ,
        methods : ["GET","POST","PUT","PATCH","DELETE"],
        credentials : true,
        transports: ["websocket"], 
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


    // SEND AND RECEIVE MESSAGE                                                                                             // ALSO FETCH HERE THAT ARE WE SENDING THIS TO A USER OR A GOURP ? 
    socket.on("message",(data) => {                                                                                         //data => {friendSocketId,friend_data,message,userDetails} // userDetails=> {_id,name,etc...} , friend_data => {_id,name,etc .....} , members : [] , GroupId
        // console.log(data.friendSocketId , data.friend_data._id, data.message , data.userdetails._id , data.isGroup) ; 
        console.log(`TO FRIEND SOCKET ID : ${data.friendSocketId} ,\n FRIEND ID : ${data.friend_data._id},\n FROM : ${data.userdetails._id},\n  Message : ${data.message} ,\n Is group selected ${data.isGroup} ,\n Group Id : ${data.GroupId } ,\n Group Members : ${data.members}, \n Sender Image : ${data.senderImage}`)
        if(data.friendSocketId != "") {
            addMessageToDb(data) ; 
            if(!data.isGroup) {
                io.to(data.friendSocketId).emit("receive_messages",data) ; 
            }
            else {
                for(let i = 0 ; i < data.members.length ; i++) {
                    const SocketId = userSocketMap[data.members[i]] ; 
                    if(SocketId && SocketId != userSocketMap[data.userdetails._id]) {
                        io.to(SocketId).emit("receive_messages",data) ;                                                     // Ignore the senders id because its creating 2 entries !
                    }
                    else{
                        // do not emit
                    }
                }
            }
        }
        else{
            addMessageToDb(data) ; 
            if(!data.isGroup) {
                // user will automatically get message when user will come back online
            }
            else {
                for(let i = 0 ; i < data.members.length ; i++) {
                    const SocketId = userSocketMap[data.members[i]] ; 
                    if(SocketId && SocketId != userSocketMap[data.userdetails._id]) {
                        io.to(SocketId).emit("receive_messages",data) ;                                                   
                    }
                    else{
                        // do not emit
                    }
                }
            }
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


    // CREATE GROUP 
    socket.on("CreateGroup", async (data) => { // {admin , filteredMembers , creatingGroupName}
        console.log(`Group Created By : ${data.admin} members : ${data.filteredMembers} , Name : ${data.creatingGroupName} Image : default in schema`) ; 
        const obj = await Create_Group(data) ; // {boolean : true , newGroup}
        if(obj.boolean) {
            for(let i = 0 ; i < data.filteredMembers.length ; i++) {
                const memberId = data.filteredMembers[i] ; 
                const socketId = userSocketMap[memberId] ; 
                if(socketId) {
                    console.log("Emitting new Group" , obj.newGroup) ; 
                    io.to(socketId).emit("Group_Created", obj.newGroup) ; 
                }
                else{
                    // do not emit just store it !
                }
            }
        }
        else{
            // do not emit because internal server error occured ! while creating group !
        }
    });

    // DELETE GROUP
    socket.on("Delete:Group" , async (data) => { // {id,selectedGroupId,participants}
        console.log("Admin Id : ", data.id , "of GROUP !", data.selectedGroupId , "Participants : ", data.participants) ; 
        const obj = await DeleteGroup(data) ; 
        if(obj.boolean) {
            // update all users Groups therefore return friendsModel.Groups
             for(let i = 0 ; i < data.participants.length ; i++ ) {
                const groups = await UpdatedGroups( {user_id : data.participants[i], selectedGroupId : data.selectedGroupId } ) ; // will return {boolean : true , updatedFriendData} 
                if(obj.boolean) { // i.e data has been updated successfully 
                    // find socket id of that participant 
                    const socketId = userSocketMap[data.participants[i]] ; 
                    if(socketId) {
                        io.to(socketId).emit("Group:Deleted", { groups : groups.Groups , id_of_deleted_group : data.selectedGroupId }) ; 
                    }
                    else{
                        // do not emit 
                    }
                }
                else{
                    // do nothing becaust theres an error in removing 
                    console.log("Update Groups failed !") ; 
                }
             }
        }
        else{
            // was not removed 
            console.log("Group Deletion failed !") ; 
        }
    });  
    // LEAVE GROUP
    socket.on("Leave:Group", async (data) => { // {userdetails,selectedGroupId,members}
        console.log(`Person leaving ID : ${data.userdetails} ,\n THE GROUP ID : ${data.selectedGroupId}, \n MEMBERS : ${data.members}`);
        const obj = await Leave_Group(data) ; 
        console.log("Receiving boolean true", obj.boolean); 
        if(obj.boolean) {
            // leave_updated_group
            for(let i = 0 ; i < data.members.length ; i++) {
                // fetch their groups again ! 
                const groups = await leave_updated_group(data.members[i]) ;  // groups 
                console.log("GROUPS : " ,groups) ; 
                if(groups.boolean) {
                    const socketId = userSocketMap[data.members[i]] ; 
                    io.to(socketId).emit("Group:Left", groups.groups) ; 
                }
            }
        }   
        else{   
            console.log("Error while leaving Group !") ; 
        }
    });
    // UPDATE GROUP : EMIT TO : "Group:Updated"
    socket.on("Update:Group", async (data)=>{   // GroupId , , updatedParticipants , members ; NOTE : members : array of strings whereas updatedParticipants = array of objects {_id , name etc ...}   
        const obj = await AddOrRemoveMembers({GroupId : data.GroupId, updatedParticipants : data.updatedParticipants , members : data.members }) ; 
        if(obj.boolean) {
            for(let i = 0 ; i < data.updatedParticipants.length ; i++) {
                const user = await leave_updated_group(data.updatedParticipants[i]._id) ; 
                if(user.boolean) {
                    const socketId = userSocketMap[data.updatedParticipants[i]._id] ; 
                    if(socketId) {
                        io.to(socketId).emit("Group:Updated",user.groups) ; 
                    }
                }
            }
            for(let i = 0 ; i < data.members.length ; i++) {
                const user = await leave_updated_group(data.members[i]) ; 
                if(user.boolean) {
                    const socketId = userSocketMap[data.members[i]] ; 
                    if(socketId) {
                        io.to(socketId).emit("Group:Updated",user.groups) ; 
                    }
                }
            }
        }  
        else{
            console.log("Error while adding or removing members of the Group !") ; 
        }
    });





    // X-----------------------------------------------WEBRTC---------------------------------------------X
    // Handle ICE Candidates 
    socket.on("ice:candidate", (data) => {
        console.log(`Forwarding Ice candidate from ${data.from} to ${data.to}`) ; 
        io.to(data.to).emit("ice:candidate", {candidate: data.candidate}) ;
    });
    // Handle Incoming call 
    socket.on("user:call" , (data)=> {
        console.log(`Call from ${data.from} to ${data.to}`) ; 
        io.to(data.to).emit("incoming:call", {from : data.from , offer : data.offer , callerData : data.callerData}) ;
    });
    // End calling before user accepts or rejects it
    socket.on("EndCalling", (data) => {
        console.log("end call ")
        io.to(data.to).emit("ended:incoming:call",data) ; 
    });
    // Reject Incomming call
    socket.on("reject:incomming",(data)=>{
        console.log("Rejct incomming call") ; 
        io.to(data.to).emit("call:rejected",data) ; 
    });
    // Handke acceptance 
    socket.on("call:accepted", (data) => {
        console.log(`Call accepted by ${data.to}`) ; 
        io.to(data.to).emit("call:accepted", {answer : data.answer}) ;
    });
    // End call 
    socket.on("End:Call", (data) => {
        io.to(data.to).emit("call:ended", data) ; 
    });
    // X--------------------------------------------------------------------------------------------------X 
    
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