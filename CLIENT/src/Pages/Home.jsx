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
      
    </div>
  )
}

export default Home
