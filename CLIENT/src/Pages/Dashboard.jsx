import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from "axios" ; 
import {io} from "socket.io-client"
import { useNavigate } from 'react-router-dom';

//CONTACTS



const Dashboard = () => {
  // CONTACTS !
  const functionContacts = async (id) => {
    try {
      console.log("User contacts Id",id) ; 
      const response = await axios.get(`http://localhost:4000/user/contacts`,{withCredentials:true}) ; 
      if(response.data.boolean) {
        setUserContacts(response.data.contacts) ;
        // HERE WE WILL FETCH USER CONTACTS LIKE ABOVE : 
        // USER SEND REQUESTED LIST , USER RECEIVE REQUEST LIST , USER BLOCK LIST , USER BLOCK BY LIST 
        setSentRequest(response.data.SentRequest) ;
        setReceiveRequest(response.data.ReceiveRequest) ; 
        // console.log("User requestedQueue ",response.data.requestedQueue) ; 
        // setBlockedContacts(response.data.BlockedContacts) ; 
        // console.log("User Blocked Queue ", response.data.BlockedContacts) ; 
      }
      else{
        console.log("User array return false") ;
      }
    } catch (error) {
      navigate('/') ;
      console.log("ERROR WHILE FETCHING USER CONTACTS !") ; 
    }
  };

  // CONNECT 
  const navigate = useNavigate() ; 
  const socket = useMemo(()=> io("http://localhost:4000"),[]) ; // setting up the socket server // CHECKPOINT 6
  useEffect(()=>{
    try {
      const verifiyToken = async () => {
        const response = await axios.get("http://localhost:4000/user/personal" , {withCredentials : true}) ; 
        if(response.data.boolean) { //  logged in 
          setUserDetails(response.data.user) ; 
          functionContacts(response.data.user._id) ; // CHECK POINT 4 : CONTACTS 
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
            console.log(`FROM : ${data.userdetails.name} & its id : ${data.userdetails._id}, SOCKET ID :${data.friendSocketId} , Message : ${data.message}`);
            // in here if data.userdetails._id == friend_data._id then append that message to chat array
            if(data.userdetails._id == friendIdRef.current) { // BUG HERE 
              setChatsArray((chats)=>[...chats,{
                senderId : data.userdetails._id ,
                text : data.message , 
                createdAt : Date.now() 
              }]);
            }
          });
          // 5) SEND REQUEST 
          socket.on("send_request", (data) => {
            console.log("Send request data",data) ; 
            setSentRequest(data); // not here when im printing this array of sentRequest im just seeing map and rest values of ele.name , ele.image is not being seen and same as below this function
          });
          socket.on("receive_request", (data) => {
            console.log("receive request data",data) // same as above
            setReceiveRequest(data) ;             
          })
        }
        else{
          navigate('/') ;
        }
        };  
        verifiyToken() ; 
    } catch (error) {
      console.log("ERROR WHILE FETCHING USER DETAILS !") ;
    }
    return () => {
      socket.disconnect() ; 
      setMySocketId("") ; 
    }
  },[socket]);

  // SEARCH
  const [MySocketId,setMySocketId] = useState("") ;             // USER SOCKET ID : 
  const [userdetails,setUserDetails] = useState({}) ;           // USER DETAILS
  const [search_input,setSearchInput] = useState('') ;          // SEARCH INPUT
  const [usersArray,setUsersArray] = useState([]) ;             // search input user Array
  const [onlineUsers, setOnlineUsers] = useState({});           // userSocketMap : initially empty
  const [serverErrorLoadingChats,setServerError] = useState("") ; 
  const latestQuery = useRef('');
  let searchTimeout;

  const handleSearchInput = (e) => {     // CHECK POINT 5
    const value = e.target.value;
    setSearchInput(value);
    latestQuery.current = value; // Update the latest query immediately
    clearTimeout(searchTimeout);
    if (value) {
      searchTimeout = setTimeout(async () => {
        try {
          const response = await axios.get(`http://localhost:4000/user/search/${value}` , {withCredentials : true});
          if (value === latestQuery.current) {
            setUsersArray(response.data.boolean ? response.data.array : []);
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
      const response = await axios.get('http://localhost:4000/auth/logout' , {withCredentials : true}) ; 
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
  const [friend_data,setFriendData] = useState({_id:"",image:"https://th.bing.com/th/id/OIP.tuHNM-LQLhwdfR01L2x-mQAAAA?w=400&h=400&rs=1&pid=ImgDetMain",name:"Avatar",email:""}) ;
  const [friendSocketId,setFriendSocketId] = useState("") ;
  const friendIdRef = useRef(friend_data._id);                              // CHECKPOINT 2 
  useEffect(() => {
    friendIdRef.current = friend_data._id;
  }, [friend_data._id]);
  
  const handleFriendData = (id,triggeredFrom) => {
    let selectedFriend ;
    if(triggeredFrom == "search") {
      selectedFriend = usersArray.find((user) => user._id === id);
    }
    else{
      selectedFriend = userContacts.find((user) => user._id === id);
    }
    if (selectedFriend) {
      setFriendData(selectedFriend);
      console.log(`SELECTED ID OF ELEMENT ${selectedFriend._id}`) ; 
      const friend = onlineUsers[selectedFriend._id] ; 
      if(friend) {
        console.log(`${selectedFriend.name} ONLINE AND ITS SOCKET ID : ${friend}`) ;
        setFriendSocketId(friend) ;
      }
      else{
        console.log(`${selectedFriend.name} OFFLINE AND ITS SOCKET ID : ${friend}`);
        setFriendSocketId("") ;
      }

      // fetch their chats weather they are online or not ! 
      try {
        const fetchChats = async () => {
          const response = await axios.post('http://localhost:4000/messages/get', {user_id : userdetails._id, friend_id : selectedFriend._id} , {withCredentials : true}) ; 
          if(response.data.boolean) {
            console.log(response.data.array) ; 
            setChatsArray(response.data.array) ; 
            setServerError(response.data.message) ; // this useState is for displaying like No chats present here !
          }
          else{
            alert(response.data.message) ; 
            navigate('/') ; // navigate to auth page for example if cookie is not verified
          }
        };
        fetchChats() ; 
      } catch (error) {
        console.log("ERROR WHILE FETCHING CHATS !", error) ; 
        alert("Request time out !") ; 
        navigate('/') ; // navigate to auth page for example if cookie is not verified
      }
    } 
  };

  // MESSAGE AND CHAT
  const [message,setMessage] = useState('') ;                // MESSAGE 
  const [chats,setChatsArray] = useState([]) ;               // CHATS ARRAY   // CHECK POINT 3
  const handleMessage = (e) => {
    setMessage(e.target.value) ;
  }
  const handleSent = async (e) => {
    e.preventDefault() ; 
    console.log(`TO : ${friendSocketId} , FRIEND ID : ${friend_data._id}: message : ${message} `) ; 
    // append it to chat array too .... 
    setChatsArray((chats)=>[...chats,{
      senderId : userdetails._id ,
      text : message , 
      createdAt : Date.now() 
    }]);
    socket.emit("message",{friendSocketId,friend_data,message,userdetails}) ; 
    setMessage("") ; 
  };

  // CONNECTIONS : 
  const [userContacts,setUserContacts] = useState([]) ;         // USER CONTACTS ; 
  {/* IF these useStates were only Array then we could have accessed these as {var[ele._id] ? "display_none" : ''} in css 
    But since they are array of objects therefore we are going with this syntax : 
    SentRequest.some(req => req._id === ele._id) */}
  const [SentRequest,setSentRequest] = useState([]) ;          // USER SENT CONNECTION REQUEST ARRAY
  const [ReceiveRequest,setReceiveRequest] = useState([]) // user receiving request array 
  const [BlockedContacts,setBlockedContacts] = useState([]) ;   // USER HAS BLOCKED THESE CONTACTS ARRAY
  const [BlockedBy,setBlockedBy] = useState([]) ;     // user has been blocked by these people
  const [blockId ,setBlockId] = useState("")                    // Selected Id for blocking user 
  // BLOCK 
    const handleBlock = (id) => {
      setBlockId(id) ; 
    }
    const handleBlockYes = () => {
      console.log("ID FOR BLOCKING : ", blockId) ; 
      // use socket io 
      // emit id to backend
      // update user array of blocked : add this id there
      // also check if this id is present in contacts || SentRequest || ReceiveRequest then remove it 
      // also add user id to persons blocked by array 
      // also check is user id is present in contacts || sendRequestarray || ReceiveRequest then remove it 
      
      // ALSO CHECK IF THEIR CHATS EXISTS AND REMOVE FROM CHAT AND MESSAGE BECAUSE OF LIMITED RESOURCES ... 
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
    } 
  // SEND REQUEST
    const Request = (id) => { // receive id of that user
      console.log("CONNECTION REQUEST TO : ", id) ; 
      // 1st add in array above 
      // use socket io to send req. in backend real time 
      // receive in backend and update this user sentRequest array in backend and other person receiveRequest
      // emit from backend and receive in useEffect and update receive request array
      socket.emit("addRequest",{friend_id : id , user_id : userdetails._id , userSocketId : MySocketId , friendSocketId :  onlineUsers[id] || null }) ;  
      // here online users is a map of key value paris of user_id and their socket id thereofre if friend id is present in map return the socket value in her as a value else make the value ""
    }
  // ACCEPT
    const Accept = (id) => { // receive id of that user
      console.log("ACCEPTING REQUEST TO : ", id) ; 
      // io.emit id of that user 
      // in backend update : 
      //       (i) add person in contacts of user and (ii) visa versa 
      //        remove person from user's receive request array 
      //        remove user from persons sent request array
      // emit from backend these updated array : contacts , sentRequest , receive request 
      // update these three arrays in frontend
      socket.emit("Accept", {friend_id : id , user_id : userdetails._id , userSocketId : MySocketId , friendSocketId : onlineUsers[id] || null })
      // here online users is a map of key value paris of user_id and their socket id thereofre if friend id is present in map return the socket value in her as a value else make the value ""
    }
  // CANCEL REQUEST
    const cancelRequest = (id) => { // receive id of that user 
      console.log("CANCEL REQUEST TO : ", id) ; 
      // 1st remove from request array above
      // use socket io to send req.in backend real time 
      // receive in backend and update this user sendRequest array in backend and other person receiveRequest 
      // emit from backend and receive in useEffect and update receive request array 
    }
  // REJECT 
    const Reject = (id) => {
      console.log("REJECT REQUEST : ", id); 
      // remove from user receive request
      // remove from other person sent request array
    }
  // DELETE CHATS 
    const DeleteChats = (id) => {
      console.log("DELETING CHATS OF THIS ID : ", id) ; 
      // io. emit this command : 
      // in backend receive 
      // check if the chats exists : 
      // remove from messages first : 
      // remove chat id 
      // return setCharArray to null
    }

  return (
    <>
    <div className='profile'>
      <img src={userdetails.image} alt="avatar" onClick={()=>{navigate('/profile')}} />
      {/* <p className='notification_counter'>1</p> */}
      <p>{userdetails.name}</p>
      {/* <p>{MySocketId}</p> After Login : .connect id will be set AT PAGE REFRESH .emit id will set */}
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
                      <div key={ele._id} className={`people ${BlockedContacts[ele._id] ? 'display_none' : ''} ${BlockedBy[ele._id] ? 'display_none' : ""}`}> {/* If a person is blocked we will not display that person && if the user is blocked by someone we will not display that person too*/}
                        <div className='user-card'> 
                          <div onClick={()=>{handleFriendData(ele._id,"search")}} className='box1'>
                            <img src={ele.image} alt='User Avatar' />
                            <p>{ele.name}</p>
                            <div className={`status ${onlineUsers[ele._id] ? 'online_status' : ''}`}></div> 
                          </div>
                          {/* this means also assign another class , 
                            we can assign 2 classes like this className="status online_status" */}
                          <div className='box2'>
                            <button className={`Connect ${ele._id == userdetails._id ? 'display_none' : ''} ${SentRequest.some(req => req._id === ele._id) ? 'display_none' : ''} ${ReceiveRequest.some(req=>req._id === ele._id) ? 'display_none' : ''}`} onClick={()=>Request(ele._id)}>Connect</button> 
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
              <div key={ele._id} onClick={()=>{handleFriendData(ele._id,"contacts")}} className={`user-card contacts_section ${BlockedContacts[ele._id] ? 'display_none' : ''} ${BlockedBy[ele._id] ? 'display_none' : ""}`} > {/* If a person is blocked we will not display that person && if user is blocked by someOne we will not diplay thet person too*/}
                  <img src={ele.image} alt='User Avatar' />
                  <p>{ele.name}</p>
                  <div className={`status ${onlineUsers[ele._id] ? 'online_status' : ''}`}></div> 
                  {/* this means also assign another class , 
                  we can assign 2 classes like this className="status online_status" */}
                  {/* <button onClick={()=>{DeleteChats(ele._id)}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                    <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                  </svg>
                  </button> */}
              </div>
          ))
      ) : (
          <p className={`no_result_found ${userContacts.length === 0 ? '' : 'display_none'} `}>No results found</p>
      )}
    </div>
    </div> 
    <div className='dashboard'>
      <h2>REQUESTS</h2>
      <div className='array_div'>
        {ReceiveRequest.length > 0 ? (
          ReceiveRequest.map((ele,index) => (
              <div key={index} className={`user-card contacts_section ${BlockedContacts[ele._id] ? 'display_none' : ''} ${BlockedBy[ele._id] ? 'display_none' : ""}`} > {/* If a person is blocked we will not display that person && if user is blocked by someOne we will not diplay thet person too*/}
                  <img src={ele.image} alt='User Avatar' />
                  <p>{ele.name}</p>
                  <div className={`status ${onlineUsers[ele._id] ? 'online_status' : ''}`}></div> 
                  {/* this means also assign another class , 
                  we can assign 2 classes like this className="status online_status" */}
                  <button onClick={()=>{Accept(ele._id)}}>Accept</button>
                  <button onClick={()=>{Reject(ele._id)}}>Cancel</button>
              </div>
          ))
      ) : (
          <p className={`no_result_found ${ReceiveRequest.length === 0 ? '' : 'display_none'} `}>No results found</p>
      )}
    </div>
    </div> 

    <div className='chats'>
      {friend_data._id == "" ? (
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
          {/* <p>{friend_data._id}</p> */}
          <div className={`status ${onlineUsers[friend_data._id] ? 'online_status' : ''}`}></div>
        </div>
        <div className='messages'>
          {chats.length > 0 ? (
            <>
            {chats.map((ele,index)=>(
              <p key={index} className={`${ele.senderId == userdetails._id ? "personal_user" : "other_user"}`}>{ele.text}</p>  
            ))}
            </>
          ) : (
            <>
              <p className='other_user'>{serverErrorLoadingChats}</p>
            </>
          )}
        </div>
          <div className={`message_input ${userContacts.some(contact => contact._id === friend_data._id) ? '' : "display_none"}`}> {/* If a person is in contacts list then only display*/}
          <input type="text" name="message" value={message} onChange={handleMessage} />
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-send" viewBox="0 0 16 16" onClick={handleSent}>
            <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
          </svg>
        </div>
      </>
      )}
    </div>
    </>
  )
}

export default Dashboard ;