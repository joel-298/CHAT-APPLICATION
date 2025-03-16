import React, { useEffect } from 'react' ;
import { useNavigate } from 'react-router-dom' ;
import axios from "axios" ; 

const Home = () => {
    const navigate = useNavigate() ; 
    useEffect(()=>{
      try {
        const verifiyToken = async () => {
          const response = await axios.get("https://chat-application-ke4k.onrender.com/auth/verify" , {withCredentials : true}) ; 
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
      <h3>If u face any login or Signup Issues Try allowing "third-party cookies"</h3>

      <br /><br />
      <h3>PROBLEM : I'm currently facing a deployment issue with the video calling feature. It works fine when both users are on the same WiFi/network but does not function correctly when they are on different networks.</h3>
      <h3>REASON :The issue is due to the absence of a TURN server.</h3>
      <h3>EXPLANATION : STUN (Session Traversal Utilities for NAT) servers help discover the public IP of a device but fail when both peers are behind symmetric NATs or strict firewalls.
                        TURN servers act as a relay to ensure connectivity in these cases.
      </h3>
    </div>
  )
}

export default Home
