import React, { useEffect } from 'react' ;
import { useNavigate } from 'react-router-dom' ;
import axios from "axios" ; 

const Home = () => {
    const navigate = useNavigate() ; 
    useEffect(()=>{
      try {
        const verifiyToken = async () => {
          const response = await axios.get("http://localhost:4000/auth/verify" , {withCredentials : true}) ; 
          if(response.data.boolean) { // already logged 
            navigate('/dashboard') ; 
          }
        };  
        verifiyToken() ; 
      } catch (error) {
        console.log(error) ; 
        alert("Error while verifing") ; 
        navigate("/") ; 
      }
    },[]);
  
    const handleSignup = () => {
        navigate('/signup') ; 
    }
    const handleLogin = () => {
        navigate('/login') ; 
    }
        
  return (
    <div>
      WELCOME TO OUR CHAT APPLICATION PLEASE LOGIN OR SIGNUP
      <button onClick={handleSignup}>SIGNUP</button>
      <button onClick={handleLogin}>LOGIN</button>


      <h1>TO ALL THOSE WHO ARE VISITING !</h1>
      <h3>Sorry about the ui im working on the css part !</h3>
      <h3>Apart from that all the other functionalities are working</h3>
      <h2>List of functionalities :</h2>
      <ul>
        <li>Users can connect by sending connection requests</li>
        <li>Users can send , receive , accept , reject requests of other users</li>
        <li>Users cannot chat with each other untill they are connected with each other</li>
        <li>Users can block each other and that blocked person will not be able to find the account of the user who has just blocked him !</li>
        <li>Also the person who has Blocked another user will now be able to see that blocked users account in search bar or contacts untill and unless he/she unblocks him/her</li>
        <li>Users can see the connection requests that they have received and also can see the accounts that they have blocked with an option to unblock those accounts</li>
        <li>can chat in real time using socket.io</li>
        <li>webrtc for video streaming in real time only possible if both users are online</li>
        <li>Messages are being stored in db</li>
        <li>User can create groups , add or remove members of that groups too</li>
      </ul>
    </div>
  )
}

export default Home
