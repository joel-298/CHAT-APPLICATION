import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from "axios" ; 
import {io} from "socket.io-client"
import { useNavigate } from 'react-router-dom';





const Dashboard = () => {
  // VIDEO USESTATES : 
  const [myStream, setMyStream] = useState(null);                     // My stream : capture my data 
  const [remoteStream, setRemoteStream] = useState(null);             // receiving stream : capture receiving stream
  const peerConnection = useRef(null);                                // contain the connection details : Q3) 
  const localVideoRef = useRef();                                     // my video                         Q4)
  const remoteVideoRef = useRef();  
  
  // CALL RELATED USESTATES 
  const [inCall,setInCall] = useState(false) ;                         // IN CALL OR NOT  
  const [connectionId,setConnectionId] = useState("") ;                // CALLER ID : we will obtain its socket id later for further end call functionality !
  const [friendDisconnected,setFriendDisconnected] = useState(true) ;  // To show no one in the call please leave !

  const [inCommingData,setIncommingData] = useState({}) ;              // CALLER : name , image , id
  const [Offer,setIncommingOffer] = useState(null) ;                   // Incomming offer 

  const [Calling, setCalling] = useState(false) ;                      // CALLING SOMEONE  
                           
  const [inCommingCall,setIncommingCall] = useState(false) ;           // RECEIVING CALL ? 










  // CONTACTS 
  const functionContacts = async (id) => {
    try {
      console.log("User contacts Id",id) ; 
      const response = await axios.get(`https://chat-application-ke4k.onrender.com/user/contacts`,{withCredentials:true}) ; 
      if(response.data.boolean) {
        setUserContacts(response.data.contacts) ;
        // HERE WE WILL FETCH USER CONTACTS LIKE ABOVE : 
        // USER SEND REQUESTED LIST , USER RECEIVE REQUEST LIST , USER BLOCK LIST , USER BLOCK BY LIST 
        setSentRequest(response.data.SentRequest) ;
        setReceiveRequest(response.data.ReceiveRequest) ; 
        setBlockedContacts(response.data.BlockedContacts);
        setBlockedBy(response.data.BlockedBy);
        setGroups(response.data.Groups) ; 
        console.log(response.data.Groups) ; // console
      }
      else{
        console.log("User array return false") ;
        alert("User array return false") ; 
      }
    } catch (error) {
      navigate('/') ;
      alert("ERROR WHILE FETCHING USER CONTACTS !") ; 
    }
  };






  // CONNECT 
  const navigate = useNavigate() ; 
  const socket = useMemo(()=> io("https://chat-application-ke4k.onrender.com", {
    transports: ["websocket", "polling"], // Allow both WebSocket and polling
    withCredentials: true,
  }),[]) ; // setting up the socket server // CHECKPOINT 6
  useEffect(()=>{
    try {
      const verifiyToken = async () => {
        const response = await axios.get("https://chat-application-ke4k.onrender.com/user/personal" , {withCredentials : true}) ; 
        if(response.data.boolean) { //  logged in 
          setUserDetails(response.data.user) ; 
          functionContacts(response.data.user._id) ; 
          // ALSO FETCH CHATARRAY DASHBOARD
          // 1) Emit only after token verification
          socket.emit("user_online", response.data.user._id);       // CHECK POINT 1
          setMySocketId(socket.id) ; 
          // 2) SOCKET CONNECTION : 
          socket.on("connect", () => {
            setMySocketId(socket.id) ; 
          });
          // 3) LISTEN FOR ALL USERS : Login and Logout
          socket.on("update_users", (users) => {
            setOnlineUsers(users); 
            console.log(`selected friend's id : ${friendIdRef.current}`) ; // CHECK POINT 2 : 
            if(users[friendIdRef.current]) {
              setFriendSocketId(users[friendIdRef.current]) ; 
            }
          });
          // 4) RECEIVE MESSAGES 
          socket.on("receive_messages", (data) => {
            console.log(`RECEIVING ! MY SOCKET ID : ${data.friendSocketId} ,\n MY ID :${data.friend_data._id} ,\n MESSAGE : ${data.message} ,\n FROM : ${data.userdetails._id} ,\n IS GROUP : ${data.isGroup} ,\n MEMBERS : ${data.members}, \n GROUP ID : ${data.GroupId}`) ; 
            
            if(data.isGroup) { // i.e group selected 
              console.log(`DATA.GROUPID : ${data.GroupId} , SELECTED GROUP ID : ${friendIdRef.current}` ) ; 
              console.log(data.GroupId == friendIdRef.current) ; 
              if(data.GroupId == friendIdRef.current){ 
                setChatsArray((chats)=>[...chats,{
                  senderId : data.userdetails._id ,
                  text : data.message , 
                  createdAt : Date.now() ,
                  image : data.senderImage
                }]);
              }
            } else{ // group is not selected 
              if(data.userdetails._id == friendIdRef.current){ 
                setChatsArray((chats)=>[...chats,{
                  senderId : data.userdetails._id ,
                  text : data.message , 
                  createdAt : Date.now() ,
                  image : data.senderImage
                }]);
              }
            }
          });
          // 5) SEND REQUEST 
          socket.on("send_request", (data) => {
            console.log("Send request data",data) ; 
            setSentRequest(data);                                                       
          });
          // 6) RECEIVE REQUEST 
          socket.on("receive_request", (data) => {
            console.log("receive request data",data)
            setReceiveRequest(data) ;             
          }); 
          // 7) ACCEPT REQUEST 
          socket.on("accept_request", (data) => {
            setUserContacts(data.contacts) ; 
            setReceiveRequest(data.receive) ; 
          });
          // 8) ACCEPTED BY REQUEST
          socket.on("accepted_by_request", (data) => {
            setUserContacts(data.contacts) ; 
            setSentRequest(data.sent) ; 
          });
          // 9) REJECT REQUEST 
          socket.on("reject_request", (data) => {
            setReceiveRequest(data) ; 
          });
          // 10) REJECTED BY REQUEST
          socket.on("rejected_by_request", (data) => {
            setSentRequest(data);
          });
          // 11) UNFOLLOW REQUEST
          socket.on("unfollow_request", (data) => {
            setUserContacts(data);
          });
          // 12) UNFOLLOWED BY REQUEST
          socket.on("unfollowed_by_request", (data) => {
            setUserContacts(data);
          });
          // 13) CANCELED REQUEST
          socket.on("cancel_request", (data) => {
            setSentRequest(data) ; 
          });
          // 14) CANCELLED BY REQUEST
          socket.on("cancelled_by_request", (data) => {
            setReceiveRequest(data)
          });
          // 15) BLOCK REQUEST
          socket.on("block_request", (data) => {
            setBlockedContacts(data); 
          });
          // 16) BLOCKED BY REQUEST
          socket.on("blocked_by_request", (data) => {
            setBlockedBy(data); 
          });
          // 17) UNBLOCK REQUEST 
          socket.on("unblock_request", (data) => {
            setBlockedContacts(data) ; 
          });
          // 18) UNBLOCKED BY REQUEST 
          socket.on("unblocked_by_request",(data)=>{
            setBlockedBy(data) ; 
          });

          // 19) Receiver function in update Groups !
          socket.on("Group_Created", (data) => { 
            setGroups((prevGroups)=>[...prevGroups,data]) ; // add a new Group too  
            console.log(Groups) ; 
          });
          // 20) Group Deleted 
          socket.on("Group:Deleted", ({ groups, id_of_deleted_group }) => {      // reciving group array from friend , and deleted group id
            setGroups(groups) ; 
            console.log(friendIdRef.current , id_of_deleted_group);
            if(friendIdRef.current == id_of_deleted_group) {                     // what we are doing here that if one of the participants has opened this group in his chatbox then update it because it dosn't exists anyore
              setFriendData({_id:"",image:"https://th.bing.com/th/id/OIP.tuHNM-LQLhwdfR01L2x-mQAAAA?w=400&h=400&rs=1&pid=ImgDetMain",name:"Avatar"}) ;
            }
          }); 
          // 21) GROUP left
          socket.on("Group:Left", (data) => { // {message automatically , Groups : populated !}
            console.log("updated groups of users : ", data) ; 
            setGroups(data) ; 
          }) ;
          // 22) RECEIVE UPDATED GROUPS OF USER : (when someone leaves or joins or if user is added into a new group or removed from a group)
          socket.on("Group:Updated", (data) => {
            console.log("updated groups of users : ", data) ; 
            setGroups(data) ; 
          });
                                                                                        // W E B R T C 
          // (23) Setting the ice candidate of the receiver ! 
          socket.on("ice:candidate", async (data) => {
            console.log("Received ICE candidates from peer : ", data.candidate) ; 
            if(peerConnection.current && data.candidate) { // connection exists and candidate != undefined || null
              try{
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate)) ; // making the Ice candidate connection Q6,7,8
                console.log("Successfully added the ICE candidate !") ; 
              } catch (error) {
                console.log("Failed to add Ice candidate !", error) ; 
              }
            }
          });
          // (24) RECEIVING INCOMMING CALL 
          socket.on("incoming:call", (data) => {                  // { from, offer, callerData }
            console.log("incoming : call from : " , data.from) ; 
            setIncommingCall(true) ;                                    // set incomming call 
            setIncommingData(data.callerData) ;                         // set incomming data
            setIncommingOffer(data.offer) ;                             // set incomming offer
            resetCallState()  ;                                         // if already connected with someone and some's connection got lost
            setCalling(false) ;
            setInCall(false) ; 
          }); 
          // (25) CALL ENDED BY CALLER BEFORE USER COULD ACCEPT OR REJECT IT !
          socket.on("ended:incoming:call", (data) => {            // In comming call was ended by the caller
            setConnectionId("") ; // makes sure that they are in call
            setIncommingData({}) ;  
            setIncommingOffer(null) ; 
            setInCall(false) ; 
            setIncommingCall(false) ;            
            setConnectionId("") ; 
            setFriendDisconnected(true) ; 
            resetCallState() ;
          });
          // (26) END CALL 
          socket.on("call:ended", (data)=> {
            setConnectionId("") ; // makes sure that they are in call
            setIncommingData({}) ; 
            setFriendDisconnected(true) ; 
            endCalling() ;
            endCall() ; 
            resetCallState() ;
            console.log("FriendDisconnected Right ? : ",friendDisconnected) ; // this is not being displayed when the person who calls disconnects
          });
          socket.on("call:rejected", async (data) => {        
            setConnectionId("") ; // makes sure that they are in call
            setIncommingData({}) ; 
            setFriendDisconnected(true) ; 
            setIncommingCall(false) ; 
            setIncommingData({}) ;
            setIncommingOffer(null) ; 
            setInCall(false) ; 
            resetCallState() ;
            setCalling(false) ;
          });
          // (27) CALL ACCEPTED : set remoteDescription with answer
          socket.on("call:accepted", async (data) => {
            console.log("Call accepted with answer : ", data.answer) ; 
            if(peerConnection.current) {
              await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer)) ; 
              setInCall(true) ; 
              setCalling(false) ; 
            }
            else{
              console.log("Peer Connection is not initialized") ; 
            }
          });  
          // X----------------------------------------------------------------------------------------------X
        }
        else{
          navigate('/') ;
        }
        };  
        verifiyToken() ; 
    } catch (error) {
      alert("ERROR WHILE FETCHING USER DETAILS !") ;
    }
    return () => {    
      // endCall() ;  
      // endCalling() ; 
      socket.disconnect() ; 
      setMySocketId("") ; 
    }
  },[socket]);









  // SEARCH BAR FUNCTIONALITY !
  const [MySocketId,setMySocketId] = useState("") ;                                // USER SOCKET ID : 
  const [userdetails,setUserDetails] = useState({}) ;                              // USER DETAILS
  const [search_input,setSearchInput] = useState('') ;                             // SEARCH INPUT
  const [usersArray,setUsersArray] = useState([]) ;                                // search input user Array
  const [onlineUsers, setOnlineUsers] = useState({});                              // userSocketMap : initially empty
  const [serverErrorLoadingChats,setServerError] = useState("") ; 
  const latestQuery = useRef('');
  let searchTimeout;

  const handleSearchInput = (e) => {                                               // CHECK POINT 5
    const value = e.target.value;
    setSearchInput(value);
    latestQuery.current = value;                                                  // Update the latest query immediately
    clearTimeout(searchTimeout);
    if (value) {
      searchTimeout = setTimeout(async () => {
        try {
          const response = await axios.get(`https://chat-application-ke4k.onrender.com/user/search/${value}` , {withCredentials : true});
          if (value === latestQuery.current) {
            let filteredUsers = response.data.boolean ? response.data.array : [];

            filteredUsers = filteredUsers.filter(                                  // **Filter out users present in either BlockedContacts OR BlockedBy**
                user => 
                    !BlockedContacts.some(req => req._id === user._id) && 
                    !BlockedBy.some(req => req._id === user._id)
            );

            setUsersArray(filteredUsers);
          }
        } catch (error) {
          console.error('Error while searching for users:', error);
        }
      }, 780);
    } else {
      setUsersArray([]);
    }
  };
  










  // LOGOUT
  const handleLogout = async () => {
    try {
      const response = await axios.get('https://chat-application-ke4k.onrender.com/auth/logout' , {withCredentials : true}) ; 
      if(response.data.boolean) {
        setMySocketId("") ;
        alert(response.data.message) ; 
        navigate('/') ; 
      }
      else{
        alert(response.data.message) ; 
      }
    } catch (error) {
      alert("Error while logging out ! Client Side !") ; 
      console.log(error) ; 
    }
  } 











  // SET FRIEND DATA AND SOCKET ID IF ONLINE
  const [friend_data,setFriendData] = useState({_id:"",image:"https://th.bing.com/th/id/OIP.tuHNM-LQLhwdfR01L2x-mQAAAA?w=400&h=400&rs=1&pid=ImgDetMain",name:"Avatar"}) ;
  const [friendSocketId,setFriendSocketId] = useState("") ;
  const friendIdRef = useRef(friend_data._id);                              // CHECKPOINT 2 
  useEffect(() => {
    friendIdRef.current = friend_data._id;
  }, [friend_data._id]);
  
  const handleFriendData = (id,triggeredFrom , isGroup) => {
    let selectedFriend ;
    if(triggeredFrom == "search") {
      selectedFriend = usersArray.find((user) => user._id === id);
      setIsGroupSelected(false) ; 
    }
    else if(triggeredFrom == "contacts"){
      selectedFriend = userContacts.find((user) => user._id === id);
      setIsGroupSelected(false) ; 
    }
    else{                                                                        // TRIGGERED FROM GROUPS 
      selectedFriend = Groups.find((user) => user._id === id);                  // set group id as friend id
      setIsGroupSelected(true) ; 
      setSelectedGroupId(id) ; 
    }
    if (selectedFriend) {
      setFriendData(selectedFriend);
      console.log(`SELECTED ID OF ELEMENT ${selectedFriend._id}`) ; 
      const friend = onlineUsers[selectedFriend._id] ;                          // in case of selectedFriend._id = Group._id socket will always be ""
      if(friend) {
        console.log(`${selectedFriend.name} ONLINE AND ITS SOCKET ID : ${friend}`) ;
        setFriendSocketId(friend) ;
      }
      else{
        console.log(`${selectedFriend.name} OFFLINE AND ITS SOCKET ID : ${friend}`);
        setFriendSocketId("") ;
      }

      
      try {                                                                   // fetch their chats weather they are online or not ! 
        const fetchChats = async () => {
          console.log(isGroup) ;  
          const response = await axios.post('https://chat-application-ke4k.onrender.com/messages/get', {user_id : userdetails._id, friend_id : selectedFriend._id , isGroup : isGroup} , {withCredentials : true}) ; 
          if(response.data.boolean) {
            console.log(response.data.array) ; 
            setChatsArray(response.data.array) ; 
            setServerError(response.data.message) ;                           // this useState is for displaying like No chats present here !
          }
          else{
            alert(response.data.message) ; 
            navigate('/') ;                                                   // navigate to auth page for example if cookie is not verified
          }
        };
        fetchChats() ; 
      } catch (error) {
        console.log("ERROR WHILE FETCHING CHATS !", error) ; 
        alert("Request time out !") ; 
        navigate('/') ;                                                       // navigate to auth page for example if cookie is not verified
      }
    } 
  };





























  // MESSAGE AND CHAT
  const [message,setMessage] = useState('') ;                                 // MESSAGE 
  const [chats,setChatsArray] = useState([]) ;                                // CHATS ARRAY   // CHECK POINT 3
  const handleMessage = (e) => {
    setMessage(e.target.value) ;
  }
  const handleSent = async (e) => {
    e.preventDefault() ; 
    console.log(`TO FRIEND SOCKET ID : ${friendSocketId} ,\n FRIEND ID : ${friend_data._id},\n FROM : ${userdetails._id},\n  Message : ${message} ,\n Is group selected ${isGroupSelected} ,\n Group Id : ${selectedGroupId}`) ;   
    
    if(userdetails._id != friendIdRef.current) {                      // append it to chat array too only If selected friend is != userId
      setChatsArray((chats)=>[...chats,{
        senderId : userdetails._id ,
        text : message , 
        image : userdetails.image,
        createdAt : Date.now() 
      }]);
    }
  
    socket.emit("message",{friendSocketId,friend_data,message,userdetails,isGroup : isGroupSelected, members : selectedGroupId ? Groups.find(group => group._id === selectedGroupId)?.participants || []: [],  GroupId : isGroupSelected ? selectedGroupId : "" , senderImage : userdetails.image}) ; 
    setMessage("") ; 
  };



















  // CONNECTIONS : 
  const [userContacts,setUserContacts] = useState([]) ;               // USER CONTACTS ; 
                                                                      {/* IF these useStates were only Array then we could have accessed these as {var[ele._id] ? "display_none" : ''} in css 
                                                                        But since they are array of objects therefore we are going with this syntax : 
                                                                        SentRequest.some(req => req._id === ele._id) */}
  const [SentRequest,setSentRequest] = useState([]) ;                 // USER SENT CONNECTION REQUEST ARRAY
  const [ReceiveRequest,setReceiveRequest] = useState([])             // user receiving request array 
  const [BlockedContacts,setBlockedContacts] = useState([]) ;         // USER HAS BLOCKED THESE CONTACTS ARRAY
  const [BlockedBy,setBlockedBy] = useState([]) ;                     // user has been blocked by these people
  const [blockId ,setBlockId] = useState("")                          // Selected Id for blocking user 
  // BLOCK 
    const handleBlock = (id) => {
      setBlockId(id) ; 
    }
    const handleBlockYes = () => {
      console.log("ID FOR BLOCKING : ", blockId) ; 
      socket.emit("Block", {friend_id : blockId , user_id : userdetails._id , userSocketId : MySocketId , friendSocketId : onlineUsers[blockId] || null}) ; 
      setBlockId("") ; 
    }
    const handleBlockNo = () => {
      console.log("ID FOR NOT BLOCKING : ", blockId); 
      setBlockId("") ; 
    }
  // UNBLOCK 
    const handleUnblock = (id) => { // receive id of that user
      console.log("ID FOR UNBLOCKING : ", id) ; 
      // use socket io
      socket.emit("Unblock", {friend_id : id , user_id : userdetails._id , userSocketId : MySocketId , friendSocketId : onlineUsers[id] || null }) ; 
    } 
  // SEND REQUEST
    const Request = (id) => { // receive id of that user
      console.log("CONNECTION REQUEST TO : ", id) ; 
      socket.emit("addRequest",{friend_id : id , user_id : userdetails._id , userSocketId : MySocketId , friendSocketId :  onlineUsers[id] || null }) ;  
    }
  // ACCEPT
    const Accept = (id) => { // receive id of that user
      console.log("ACCEPTING REQUEST TO : ", id) ; 
      socket.emit("Accept", {friend_id : id , user_id : userdetails._id , userSocketId : MySocketId , friendSocketId : onlineUsers[id] || null });
    }
  // CANCEL REQUEST
    const cancelRequest = (id) => { // receive id of that user 
      console.log("CANCEL REQUEST TO : ", id) ; 
      socket.emit("CancelRequest", {friend_id : id , user_id : userdetails._id , userSocketId : MySocketId , friendSocketId : onlineUsers[id] || null }) ;
    }
  // REJECT 
    const Reject = (id) => {
      console.log("REJECT REQUEST : ", id); 
      socket.emit("Reject", {friend_id : id , user_id : userdetails._id , userSocketId : MySocketId , friendSocketId : onlineUsers[id] || null}) ; 
    }
  // REMOVE FRIEND 
  const Unfollow = (id) => {
    console.log("UNFOLLOW : ",id) ; 
    socket.emit("Unfollow",{friend_id : id , user_id : userdetails._id , userSocketId : MySocketId , friendSocketId : onlineUsers[id] || null}) ;
  }


  // ALSO HELP TO REMOVE FROM SEARCH BAR
  useEffect(() => {
    if (search_input) { // Only trigger search if input is not empty
      handleSearchInput({ target: { value: search_input } });
    }
  setReceiveRequest([...ReceiveRequest.filter(({ _id }) => 
    !BlockedContacts.some(req => req._id == _id) && 
    !BlockedBy.some(req => req._id == _id)
  )]);
  }, [BlockedContacts, BlockedBy]);






































    // CREATE GROUPS 
    const [isGroupSelected,setIsGroupSelected] = useState(false) ;  
    const [Groups,setGroups] = useState([]) ;                           // full array of groups : {image , name , participants , admin , blocked members}

    const [addgroup,setaddGroup] = useState(false) ;                  // FOR CREATING GROUPS !
    const [GroupImage,setGroupImage] = useState("") ;                 // NEW GROUP IMAGE !
    const [creatingGroupName,setCreatingGroupName] = useState("") ;   // NEW GROUP NAME !
    const [members,setMembers] = useState([]) ;                       // ADD MEMBERS TO YOUR NEWLY CREATED GROUP !

    const [selectedGroupId,setSelectedGroupId] = useState("") ;       // ID FOR EDITING GROUP ONLY ! // add more members remove members etc etc 



    // ADDING AND REMOVING MEMBERS
    const handleCheckboxChange = (_id) => {
      setMembers((prevMembers) => {
        const isMemberAlreadyAdded = prevMembers.some((member) => member === _id);
        if (isMemberAlreadyAdded) {
          return prevMembers.filter((member) => member !== _id);
        } else {
          return [...prevMembers, _id];
        }
      });
    };


    // CREATING GROUP 
    const CreateGroup = () => {
      console.log("Selected Members : ", members) ; 
      let filteredMembers = members.filter((memberId) => {
        const isBlockedContact = BlockedContacts.some((blocked) => blocked._id === memberId);
        const isBlockedBy = BlockedBy.some((blocked) => blocked._id === memberId);
        // Include the member only if they are NOT in BlockedContacts or BlockedBy
        return !isBlockedContact && !isBlockedBy;
      });
      if(creatingGroupName == "" || members.length < 1) {
        setaddGroup(false) ;
        setMembers([]) ;
        setCreatingGroupName("") ; 
        alert("Cannot create group please complete the necessary credentials !") ; 
        return ;
      }
      filteredMembers = [...filteredMembers,userdetails._id] ; // by default also add user in that group 
      console.log("Filtered Members (after removing blocked contacts):",filteredMembers);
      const admin = userdetails._id ; 
      console.log("Admin : ",admin) ; 
      socket.emit("CreateGroup", {admin , filteredMembers , creatingGroupName}) ; // in real time : group name , image , members , admin 
      setaddGroup(false) ;
      setMembers([]) ;
      setCreatingGroupName("") ; 
    }


    // LEAVING GROUP 
    const LeaveGroup = () => {
      console.log(userdetails); 
      socket.emit("message",{friendSocketId,friend_data,message : "Left the group",userdetails,isGroup : isGroupSelected, members : selectedGroupId ? Groups.find(group => group._id === selectedGroupId)?.participants || []: [],  GroupId : isGroupSelected ? selectedGroupId : "" , senderImage : userdetails.image}) ;
      socket.emit("Leave:Group", {userdetails,selectedGroupId,members : selectedGroupId ? Groups.find(group => group._id === selectedGroupId)?.participants || []: []}) ;                                                                              // for updating the groups of other users
      setFriendData({_id:"",image:"https://th.bing.com/th/id/OIP.tuHNM-LQLhwdfR01L2x-mQAAAA?w=400&h=400&rs=1&pid=ImgDetMain",name:"Avatar"}) ; // remove the group from the users ui 
    };


    // DELETING WHOLE GROUP 
    const DeleteGroup = (id) => {
      console.log(id) ; 
      socket.emit("Delete:Group", {id , selectedGroupId , participants: Groups.find((ele) => ele._id === selectedGroupId)?.participants || []}) ; 
      setIsGroupSelected(false) ; 
      setFriendData({_id:"",image:"https://th.bing.com/th/id/OIP.tuHNM-LQLhwdfR01L2x-mQAAAA?w=400&h=400&rs=1&pid=ImgDetMain",name:"Avatar"}) ;
    }



    const [viewParticipants,setViewParticipants] = useState([]) ;     // ARRAY OF OBJECTS OF PARTICIPANTS : {NAME , IMAGE , _ID} 
    const [view,setView] = useState({}) ;                             // GROUP USESTATE TO VIEW INCLUDING GROUP NAME , IMAGE AND ALL 
    // VIEW MEMBERS 
    const viewMembers = async (id,name,image) => {
      if(id == view._id) {
        setViewParticipants([]) ; 
        setView({}) ; 
      }
      else{
        try {
          setView({_id:id,name:name,image:image}) ; 
          const response = await axios.post("https://chat-application-ke4k.onrender.com/user/participants", {selectedGroupId:id} , {withCredentials : true}) ; 
          if(response.data.boolean) {
            setViewParticipants(response.data.obj.participants) ; 
          }
          else{
            console.log("Participants not found !") ; 
            navigate("/") ; 
          }
        } catch (error) { 
          console.log("Error while fetching participants",error) ; 
          alert("Request Time Out , Please try again later") ; 
          navigate("/") ; 
        }
      }
    };





    const [EditGroup,setEditGroup] = useState({}) ;                      // selected group for edit !
    const [updatedParticipants,setUpdatedParticipants] = useState([]) ;  // holds the initial and after adding or removing participants of the selected group ! 
    // EDIT GROUP ADD OR REMOVE MEMBERS !
    const EditId = async (id,name,image,admin) => {  
      if(id == EditGroup.id) {  
        setEditGroup({}) ; 
        setUpdatedParticipants([]) ;  
      }
      else{
        try {
          const response = await axios.post("https://chat-application-ke4k.onrender.com/user/participants", {selectedGroupId:id} , {withCredentials : true}) ; 
          if(response.data.boolean) {
            setEditGroup({id:id,name:name,image:image,admin:admin}) ;
            setUpdatedParticipants(response.data.obj.participants) ; // 1st add initial participants to this array !
          }
          else{
            console.log("Participants not found !") ; 
            setEditGroup({}) ; 
            setUpdatedParticipants([]) ;  
            navigate("/") ; 
          }
        } catch (error) { 
          console.log("Error while fetching participants",error) ; 
          alert("Request Time Out , Please try again later") ; 
          setEditGroup({}) ; 
          setUpdatedParticipants([]) ;  
          navigate("/") ; 
        } 
      }
    };
    // combined : group participants and contacts of admin
    const getAllParticipants = () => {
      const participantsNotInContacts = updatedParticipants.filter(                            // Participants not in userContacts
        participant => !userContacts.some(contact => contact._id === participant._id)
      );
      return [...userContacts, ...participantsNotInContacts];
    };
  // Handle checkbox change
  const handleChangeUpdatedParticipants = (e) => {
    if(updatedParticipants.some(i => i._id == e._id)) {
      setUpdatedParticipants(updatedParticipants.filter( (ele) => ele._id != e._id) ) ; 
    }
    else{
      setUpdatedParticipants((prev)=>[...prev,e]) ; 
    }
  };
  const Handle_group_update = () => { 
    setEditGroup([]) ; 
    setUpdatedParticipants([]) ; 
    // io emit to server for message ! 
    socket.emit("message",{ friendSocketId , friend_data , message : "Updated Group" , userdetails , isGroup : isGroupSelected, members :  selectedGroupId ? Groups.find(group => group._id === selectedGroupId)?.participants || []: [] ,  GroupId : isGroupSelected ? selectedGroupId : "" , senderImage : userdetails.image , updatedParticipants : updatedParticipants}) ; // NOTE :in here members = previous participants : array of ids , and updatedParticipants :  ARRAY OF OBJECTS ! : [{_id,image},{_id,image}]
    setChatsArray((chats)=>[...chats,{     // update my personal chat array !
      senderId : userdetails._id ,
      text : "Updated Group" , 
      createdAt : Date.now() ,
      image : userdetails.image
    }]);
    // updatedParticipants ! 
    socket.emit("Update:Group",{ GroupId : isGroupSelected ? selectedGroupId : "" , updatedParticipants : updatedParticipants , members :  selectedGroupId ? Groups.find(group => group._id === selectedGroupId)?.participants || []: []  }) ;    
  }




































  // X-----------------------------WEBRTC-----------------------------------------X

  // CALL SOMEONE !
  const handleCall = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({video : true, audio : true}) ; 
    setMyStream(stream) ; 
    localVideoRef.current.srcObject = stream ; 
    peerConnection.current = new RTCPeerConnection({
      iceServers : [
        { urls: "stun:stun.l.google.com:19302" }, // STUN SERVER 
        {                                         // TURN SERVER
          urls: "turn:18.209.47.41:3478", // TURN server
          username: "chatZturn", // TURN server username (if required)
          credential: "chatZturnServer" // TURN server credential (if required)
        }
      ],
      iceTransportPolicy: "all"
    });
    stream.getTracks().forEach((track) => peerConnection.current.addTrack(track,stream))
    peerConnection.current.onicecandidate = (event) => {
      if(event.candidate) {
        console.log("Sending Ice candidate ro peer : ", event.candidate) ; 
        socket.emit("ice:candidate", {to : onlineUsers[friend_data._id], from: onlineUsers[userdetails._id] ,candidate : event.candidate}) ; 
      }
      else{
        console.log("All ice candidates have been sent !") ; 
      }
    };
    peerConnection.current.ontrack = (event) => {
      console.log("Received remote Stream : ", event.streams[0]) ;
      setRemoteStream(event.streams[0]) ; 
      if(remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0] ; 
        console.log("Remote Video Stream attached to <video> element") ; 
      }
      else{
        console.log("Remote video red is not set") ; 
      }
    };
    const offer = await peerConnection.current.createOffer() ; 
    await peerConnection.current.setLocalDescription(offer) ;

    // EMIT THE CALL
    socket.emit("user:call", {to : onlineUsers[friend_data._id], from : onlineUsers[userdetails._id], offer , callerData : userdetails}) ; 
    setCalling(true) ; 
    setFriendDisconnected(false) ; 
    setIncommingCall(false) ;                 // when sending call make sure this is false
    setConnectionId(friend_data._id) ;  
    setIncommingData(friend_data) ;              // user name , image , id
  };
  




  // END CALL
  const endCall = () => {   // also emit to destroy peer connection of other user !
    socket.emit("End:Call", {to: onlineUsers[connectionId] ,from:onlineUsers[userdetails._id]}) ;
    setInCall(false) ;
    setIncommingCall(false) ;            
    setIncommingData({}) ;              // user name , image , id
    setConnectionId("") ; 
    setFriendDisconnected(true) ; 
    resetCallState() ;
  };


  // END CALL BEFORE USER CAN ACCEPT OR REJECT 
  const endCalling = () => {
    socket.emit("EndCalling", {to: onlineUsers[connectionId] ,from:onlineUsers[userdetails._id]}) ; 
    setInCall(false) ;
    setCalling(false) ;
    setIncommingCall(false) ;            
    setIncommingData({}) ;              // user name , image , id
    setConnectionId("") ; 
    setFriendDisconnected(true) ; 
    resetCallState() ;
  };


  // REJECT INCOMMING CALL
  const RejectCall = () => {
    socket.emit("reject:incomming", {to: onlineUsers[connectionId], from: onlineUsers[userdetails._id]}) ; 
    setInCall(false) ;
    setIncommingCall(false) ;            
    setIncommingData({}) ;              // user name , image , id
    setConnectionId("") ; 
    setFriendDisconnected(true) ; 
    resetCallState() ;
  };


  // ACCEPT CALL 
  const AcceptCall = async () => {
    // SETTING STREAM : 
    const stream = await navigator.mediaDevices.getUserMedia({video : true , audio : true}) ; 
    setMyStream(stream) ; 
    localVideoRef.current.srcObject = stream ; 
    // PEER CONNECTION 
    peerConnection.current = new RTCPeerConnection({
      iceServers : [
        { urls: "stun:stun.l.google.com:19302" }, // STUN SERVER 
        {                                         // TURN SERVER
          urls: "turn:18.209.47.41:3478", // TURN server
          username: "chatZturn", // TURN server username (if required)
          credential: "chatZturnServer" // TURN server credential (if required)
        }
      ],
      iceTransportPolicy: "all"
    }) ; 
    // ADD TRACKS TO PEER CONNECTION 
    stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream)) ; 
    // ICE CANDIDATES : 
    peerConnection.current.onicecandidate= (event) => {
      if(event.candidate) {
        console.log("Sending ICE candidate to peer", event.candidate) ; 
        socket.emit("ice:candidate", {to : onlineUsers[inCommingData._id] , from : onlineUsers[userdetails._id] ,candidate: event.candidate}) ; 
      } else {
        console.log("All Ice candidates have been sent !") ; 
      }
    };
    // REMOTE STREAM 
    peerConnection.current.ontrack = (event) => {
      console.log("Received remote stream : ", event.streams[0]) ; 
      setRemoteStream(event.streams[0]) ; 
      if(remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0] ; 
        console.log("Remote video stream attached to <video> element !") ; 
      } else{ 
        console.log("Remote video ref is not set !") ; 
      }
    }
    // RECEIVE OFFER FROM CALLER remoteDescription 
    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(Offer)) ; 
    // CREATE ANSWER : SET LOCALDESCRIPTION ANSWER :  
    const answer = await peerConnection.current.createAnswer() ; 
    await peerConnection.current.setLocalDescription(answer) ; 
    setInCall(true) ; 
    setConnectionId(inCommingData._id) ; // makes sure that they are in call
    setFriendDisconnected(false) ; 
    // SEND THE ANSWER BACK TO THE CALLER 
    socket.emit("call:accepted", {to: onlineUsers[inCommingData._id] , answer}) ; 
  }


  // END CALL RESET CALL STATE FUNCTION
  const resetCallState = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
      setMyStream(null);
    }
    setRemoteStream(null);
  };






















  return (
    <>
    <div className='profile'>
      <img src={userdetails.image} alt="avatar"/>
      <p>{userdetails.name}</p>
      <p>
        {userdetails.createdAt
          ? new Date(userdetails.createdAt).toLocaleString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })
          : 'Loading...'}
      </p>
      <button onClick={handleLogout} className='Logout'>LOGOUT</button>
    </div>
    <br />
    <div className='searchbar'>
            <div className='input'>
              <h3>SEARCH PEOPLE</h3>
              <input type="text" name='search' value={search_input} onChange={handleSearchInput}/>
            </div>
            <div className='result'>
              {usersArray.length > 0 ? (
                  usersArray.map((ele) => (
                      <div key={ele._id} className={`people ${BlockedContacts.some(req => req._id == ele._id) ? 'display_none' : ''} ${BlockedBy.some(req => req._id == ele._id) ? 'display_none' : ""}`}> {/* If a person is blocked we will not display that person && if the user is blocked by someone we will not display that person too*/}
                        <div className='user-card'> 
                          <div onClick={()=>{handleFriendData(ele._id,"search",false) , setSelectedGroupId("") }} className='box1'>
                            <img src={ele.image} alt='User Avatar' />
                            <p>{ele.name}</p>
                            <div className={`status ${onlineUsers[ele._id] ? 'online_status' : ''}`}></div> 
                          </div>
                          {/* this means also assign another class , 
                            we can assign 2 classes like this className="status online_status" */}
                          <div className='box2'>
                            <button className={`Connect ${ele._id == userdetails._id ? 'display_none' : ''} ${SentRequest.some(req => req._id === ele._id) ? 'display_none' : ''} ${ReceiveRequest.some(req=>req._id === ele._id) ? 'display_none' : ''} ${userContacts.some(req=>req._id === ele._id) ? 'display_none' : ''}`} onClick={()=>Request(ele._id)}>Connect</button> 
                            <button className={`Requested ${ele._id == userdetails._id ? 'display_none' : ''} ${SentRequest.some(req => req._id === ele._id) ? '' : 'display_none'}`} onClick={()=>cancelRequest(ele._id)}>Requested</button>
                            <button className={`Blockbutton ${ele._id == userdetails._id ? 'display_none' : ''}`} onClick={()=>handleBlock(ele._id)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-ban" viewBox="0 0 16 16">
                                <path d="M15 8a6.97 6.97 0 0 0-1.71-4.584l-9.874 9.875A7 7 0 0 0 15 8M2.71 12.584l9.874-9.875a7 7 0 0 0-9.874 9.874ZM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0"/>
                              </svg>
                            </button>
                            <button onClick={()=>{Accept(ele._id)}} className={`accept ${ReceiveRequest.some(req=> req._id === ele._id) ? '' : 'display_none'} `}>Accept</button>
                            <button onClick={()=>{Reject(ele._id)}} className={`reject ${ReceiveRequest.some(req=> req._id === ele._id) ? '' : 'display_none'} `}>Reject</button>
                          </div>
                        </div>
                        <div  className={`${
                          blockId === "" || ele._id === userdetails._id || (ele._id !== blockId && blockId !== "")
                              ? "display_none"
                              : "popup"
                          }`}>
                          <p>Are u sure u want to block this {ele.name} account ? </p>&nbsp;
                          <button onClick={handleBlockYes}>Yes</button>&nbsp;
                          <button onClick={handleBlockNo}>No</button>
                        </div>
                      </div>
                  ))
              ) : (
                  <p className={`no_result_found ${search_input.length === 0 ? 'display_none' : ''} `}>No results found</p>
              )}
          </div>
    </div>
    <div className='dashboard'>
      <h2>Contacts</h2>
      <div className='array_div'>
        {userContacts.length > 0 ? (
          userContacts.map((ele) => (
              <div key={ele._id} className={`contacts_section ${BlockedContacts.some(req => req._id == ele._id) ? 'display_none' : ''} ${BlockedBy.some(req => req._id == ele._id) ? 'display_none' : ""}`} > {/* If a person is blocked we will not display that person && if user is blocked by someOne we will not diplay thet person too*/}
                <div className='user-card'> 
                  <div onClick={()=>{handleFriendData(ele._id,"contacts",false) , setSelectedGroupId("") }} className='box1'>
                    <img src={ele.image} alt='User Avatar' />
                    <p>{ele.name}</p>
                    <div className={`status ${onlineUsers[ele._id] ? 'online_status' : ''}`}></div> 
                  </div>
                  {/* this means also assign another class , 
                  we can assign 2 classes like this className="status online_status" */}
                  <div className='box2'>
                    <button onClick={()=>{Unfollow(ele._id)}} className={`${userdetails._id == ele._id ? 'display_none' : ''}`}>Unfollow</button>
                    <button className={`Blockbutton ${ele._id == userdetails._id ? 'display_none' : ''}`} onClick={()=>handleBlock(ele._id)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-ban" viewBox="0 0 16 16">
                        <path d="M15 8a6.97 6.97 0 0 0-1.71-4.584l-9.874 9.875A7 7 0 0 0 15 8M2.71 12.584l9.874-9.875a7 7 0 0 0-9.874 9.874ZM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0"/>
                      </svg>
                    </button>
                  </div> 
                </div>
                <div  className={`${
                  blockId === "" || ele._id === userdetails._id || (ele._id !== blockId && blockId !== "")
                      ? "display_none"
                      : "popup"
                  }`}>
                  <p>Are u sure u want to block this {ele.name} account ? </p>&nbsp;
                  <button onClick={handleBlockYes}>Yes</button>&nbsp;
                  <button onClick={handleBlockNo}>No</button>
                </div>
              </div>
          ))
      ) : (
          <p className={`no_result_found ${userContacts.length === 0 ? '' : 'display_none'} `}>No results found</p>
      )}
    </div>
    </div><br />

    <div className='Groups'>
      <h2 className='groups_h2'>Groups</h2>
      <div className={`groups_dashboard ${addgroup == true ? "disaply_none" : ""}`}> 
        <button onClick={()=>{setaddGroup(true)}}>Add</button>
        <h3>CREATE GROUP !</h3>
      </div>

      <div className={`group_form ${addgroup == false? "display_none" : ""}`}>
        <label>
          <p>Group Name :&nbsp;</p>
          <input type="text" value={creatingGroupName} onChange={(e)=>{setCreatingGroupName(e.target.value)}} />
        </label>
        <div className='group_buttons'>
          <button onClick={CreateGroup}>Create Group</button>
          <button onClick={()=>{setaddGroup(false) , setMembers([]) , setCreatingGroupName("") }}>Cancel</button>
        </div>

        <div className='Select_Contacts'>
          {userContacts.map((ele,index)=>(
            <div className={`box1 ${BlockedContacts.some(req => req._id == ele._id) ? 'display_none' : ''} ${BlockedBy.some(req => req._id == ele._id) ? 'display_none' : ""} ${userdetails._id == ele._id ? "display_none" : ""}`} key={index}>
              <input  type="checkbox" onChange={() => handleCheckboxChange(ele._id)} checked={members.includes(ele._id)} ></input>              {/*check if member include that id*/}
              <img src={ele.image} alt='User Avatar' />
              <p>{ele.name}</p>
              <div className={`status ${onlineUsers[ele._id] ? 'online_status' : ''}`}></div> 
            </div>
          ))}
        </div>
      </div>
      
      {/*DISPLAYING ALL THE GROUPS ! onclick setGroupSelected(true) */}
      <div className='group_chat'>
        {Groups.length > 0 ? (
          Groups.map((ele,index) => ( // ----------------> (2) 
            <div key={index} className='group_card'>
              <div className='box1' onClick={()=>{handleFriendData(ele._id,"groups",true)}}>
                <img src={ele.image}></img>
                <p>{ele.name}</p>
              </div>
              <div className='box2'>
                <button className={`${ele.admin == userdetails._id ? "" : "display_none"}`} onClick={()=>{EditId(ele._id,ele.name,ele.image,ele.admin), setViewParticipants([]), setView({}), handleFriendData(ele._id,"groups",true)}} >Edit</button>
                <button onClick={()=>{viewMembers(ele._id,ele.name,ele.image), setEditGroup({})}}>view</button>
              </div>
            </div>
          ))
        ) : ( 
          <div>
            <h2 className='no_groups_present'>No Groups present !</h2>
          </div>
        )} 
      </div>
    </div><br />


    <div className='dashboard'>
      <h2>REQUESTS</h2>
      <div className='array_div'>
        {ReceiveRequest.length > 0 ? (
          ReceiveRequest.map((ele,index) => (
              <div key={index} className={`user-card contacts_section ${BlockedContacts.some(req => req._id == ele._id) ? 'display_none' : ''} ${BlockedBy.some(req => req._id == ele._id) ? 'display_none' : ""}`} >
                  <div className='box1'>
                    <img src={ele.image} alt='User Avatar' />
                    <p>{ele.name}</p>
                    <div className={`status ${onlineUsers[ele._id] ? 'online_status' : ''}`}></div> 
                  </div>
                  <div className='box2'>
                    <button onClick={()=>{Accept(ele._id)}}>Accept</button>
                    <button onClick={()=>{Reject(ele._id)}}>Reject</button>
                  </div> 
              </div>
          ))
      ) : (
          <p className={`no_result_found ${ReceiveRequest.length === 0 ? '' : 'display_none'} `}>No results found</p>
      )}
    </div>
    </div> 

    <div className='dashboard'>
      <h2>BLOCKED CONTACTS</h2>
      <div className='array_div'>
        {BlockedContacts.length > 0 ? (
          BlockedContacts.map((ele,index) => (
              <div key={index} className={`user-card contacts_section`} >
                  <div className='box1'>
                    <img src={ele.image} alt='User Avatar' />
                    <p>{ele.name}</p>
                    <div className={`status ${onlineUsers[ele._id] ? 'online_status' : ''}`}></div> 
                  </div>
                  <div className='box2'>
                    <button onClick={()=>{handleUnblock(ele._id)}}>Unblock</button>
                  </div> 
              </div>
          ))
      ) : (
          <p className={`no_result_found ${BlockedContacts.length === 0 ? '' : 'display_none'} `}>No results found</p>
      )}
    </div>
    </div> 

    <div className='chats'>
      {friend_data._id == "" || BlockedContacts.some(req => req._id == friend_data._id) || BlockedBy.some(req => req._id == friend_data._id) ? (
        <>
        <div className='no_user_selected'>
          <h2>WELCOME TO OUR CHAT APP</h2>
          <h3>CLICK ON USER TO CHAT !</h3>
        </div>
        </>
      ):(
      <>
        <div className='user-card friend'>
          <img src={friend_data.image} alt="" />
          <p>{friend_data.name}</p>
          <div className={`status ${onlineUsers[friend_data._id] ? 'online_status' : ''}`}></div>
          <button className={`${onlineUsers[friend_data._id] && userContacts.some(req => req._id == friend_data._id) && friend_data._id != userdetails._id ? '' : 'display_none'} ${inCall ? "display_none": ""} ${inCommingCall ? "display_none" : ""} ${Calling ? "display_none": ""}`} onClick={handleCall} >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-camera-video-fill" viewBox="0 0 16 16">
              <path d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2z"/>
            </svg>
          </button>
          {/* write a funcitonality here that is its a group show an button to leave group 
          if its admin show a button of delete group  */}
          <button className={`Leave_group ${isGroupSelected ? "" : "display_none"} ${Groups.some(i => i._id == selectedGroupId && userdetails._id == i.admin) ? "display_none" : ""}`} onClick={LeaveGroup}>Leave</button>
          <button className={`Delete_group ${isGroupSelected ? "" : "display_none"} ${Groups.some(i => i._id == selectedGroupId && userdetails._id != i.admin) ? "display_none" : ""}`} onClick={()=>{DeleteGroup(userdetails._id)}}>Delete Group</button>
        </div>
        <div className='messages'>
          {chats.length > 0 ? (
            <>
            {chats.map((ele,index)=>(
              <p key={index} className={`${ele.senderId == userdetails._id ? "personal_user" : "other_user"}`}><img src={ele.image}></img>&nbsp;&nbsp;{ele.text}</p>  
            ))}
            </>
          ) : (
            <>
              <p className='other_user'>{serverErrorLoadingChats}</p>
            </>
          )}
        </div>
          <div className={`message_input ${isGroupSelected ? "" : userContacts.some(contact => contact._id === friend_data._id) ? '' : "display_none" }`}> {/* If a person is in contacts list then only display*/}
          <input type="text" name="message" value={message} onChange={handleMessage} />
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-send" viewBox="0 0 16 16" onClick={handleSent}>
            <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
          </svg>
        </div>
      </>
      )}
    </div><br />
    <div className={`box3 ${viewParticipants.length == 0 ? "display_none" : ""}`}>
      <div className="heading">
        <img src={view.image} />
        <h2>{view.name}</h2>
        <h3>Group Members : {viewParticipants.length}</h3>
      </div>
      <div><button onClick={()=>{setViewParticipants([]), setView({})}}>close</button></div>
      <div className="members">
        {viewParticipants.map((ele,index)=>(
          <div className='participants_card' key={index}>
            <img src={ele.image} />&nbsp;&nbsp;
            <p>{ele.name}</p>
            <div className={`status ${onlineUsers[ele._id] ? 'online_status' : ''}`}></div> 
          </div>
        ))}
      </div>
    </div>
    <div className={`box4 ${(EditGroup != undefined || null ) && EditGroup.admin == userdetails._id ? "" : "display_none"} `}>
      <div className="heading">
        <img src={EditGroup.image} />
        <h2>{EditGroup.name}</h2>
      </div>
      <div><button onClick={()=>{setEditGroup({})}}>close</button></div>
      <div className="members">
        {getAllParticipants().map((ele,index)=>(
          <div className={`participants_card ${ele._id == userdetails._id ? "display_none" : ""}`} key={index}>
            <input type="checkbox" checked={updatedParticipants.some(i => i._id === ele._id)} onChange={()=>{handleChangeUpdatedParticipants(ele)}}/>&nbsp;&nbsp;
            <img src={ele.image} />&nbsp;&nbsp;
            <p>{ele.name}</p>
            <div className={`status ${onlineUsers[ele._id] ? 'online_status' : ''}`}></div> 
          </div>
        ))}
      </div>
      <button onClick={Handle_group_update}>SAVE</button>
    </div>
    
    

    <div className={`calling ${Calling ? "" : "display_none" }`}>
      <h2>Calling : {inCommingData.name}</h2>
      <img src={inCommingData.image}/>
      <button onClick={endCalling}>end</button>
    </div>
    <div className={`permission ${inCommingCall ? "" : "display_none"}`}>
      <h2>Incomming call from : {inCommingData.name}</h2>
      <img src={inCommingData.image}/>
      <button onClick={()=>{setIncommingCall(false) , AcceptCall()}} >Accept</button>
      <button onClick={()=>{setIncommingCall(false) , RejectCall()}} >Reject</button>
    </div>

    <div className={`WEBRTC ${inCall ? "" : "display_none"}`} >
      <div className={`${friendDisconnected ? "display_none" : ""}`}>
        <h2>In call with : </h2>
        <img src={inCommingData.image}/>&nbsp;&nbsp;<h3>{inCommingData.name}</h3>
      </div>
      <video ref={localVideoRef} autoPlay playsInline style={{ width: "300px" }} className={`my_video`}/>
      <h2 className={`${friendDisconnected ? "" : "display_none"}`}>NO ONE IN THE CALL PLEASE LEAVE</h2>
      <button className={`${friendDisconnected ? "" : "display_none"}`} onClick={endCall}>Leave</button>
      <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "300px" }} className={`friends_video`}/> 
      <button className={`endcall ${peerConnection.current ? "" : "display_none"}`} onClick={endCall}>End</button>
    </div>
    </>
  )
}

export default Dashboard ;        