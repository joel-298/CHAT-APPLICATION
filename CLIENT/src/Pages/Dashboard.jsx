import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from "axios" ; 
import {io} from "socket.io-client"
import { useNavigate } from 'react-router-dom';

// CHECK POINT 1 : CONTACTS
// const functionContacts = async (id) => {
//   try {
//     console.log(id) ; 
//     const response = await axios.post(`http://localhost:4000/user/contacts`, {id:id} ,{withCredentials:true}) ; 
//     if(response.data.boolean) {
//       setUserContacts(response.data.array);
//     }
//   } catch (error) {
//     console.log("ERROR WHILE FETCHING USER CONTACTS !") ; 
//   }
// };


const Dashboard = () => {
  // CONNECT 
  const navigate = useNavigate() ; 
  const socket = useMemo(()=> io("http://localhost:4000"),[]) ; // setting up the socket server // CHECKPOINT 6
  useEffect(()=>{
    try {
      const verifiyToken = async () => {
        const response = await axios.get("http://localhost:4000/user/personal" , {withCredentials : true}) ; 
        if(response.data.boolean) { //  logged in 
          setUserDetails(response.data.user) ; 
          // functionContacts(response.data.user._id) ; // CHECK POINT 4 : CONTACTS 
          // 1) Emit only after token verification
          socket.emit("user_online", response.data.user._id);       // CHECK POINT 1
          // 2) SOCKET CONNECTION : 
          socket.on("connect", () => {
            console.log("Connected:", socket.id);
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

          });
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
    }
  },[socket]);

  // SEARCH
  const [userdetails,setUserDetails] = useState({}) ;        // USER DETAILS
  const [userContacts,setUserContacts] = useState([]) ;      // USER CONTACTS ; 
  const [search_input,setSearchInput] = useState('') ;       // SEARCH INPUT
  const [usersArray,setUsersArray] = useState([]) ;          // search input user Array
  const [onlineUsers, setOnlineUsers] = useState({});        // userSocketMap : initially empty
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
  
  const handleFriendData = (id) => {
    const selectedFriend = usersArray.find((user) => user._id === id);
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
            setServerError(response.data.message) ; 
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
    socket.emit("message",{friendSocketId,friend_data,message,userdetails}) ; 
    setMessage("") ; 
  };

  return (
    <>
    <div className='profile'>
      <button onClick={handleLogout}>LOGOUT</button>
      <img src={userdetails.image} alt="avatar" />
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
                      <div key={ele._id} className='user-card' onClick={()=>{handleFriendData(ele._id)}} >
                          <img src={ele.image} alt='User Avatar' />
                          <p>{ele.name}</p>
                          <div className={`status ${onlineUsers[ele._id] ? 'online_status' : ''}`}></div> 
                         {/* this means also assign another class , 
                          we can assign 2 classes like this className="status online_status" */}
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
              <div key={ele._id} className='user-card' onClick={()=>{handleFriendData(ele._id)}} >
                  <img src={ele.image} alt='User Avatar' />
                  <p>{ele.name}</p>
                  <div className={`status ${onlineUsers[ele._id] ? 'online_status' : ''}`}></div> 
                  {/* this means also assign another class , 
                  we can assign 2 classes like this className="status online_status" */}
              </div>
          ))
      ) : (
          <p className={`no_result_found ${userContacts.length === 0 ? '' : 'display_none'} `}>No results found</p>
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
          <div className='message_input'>
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


