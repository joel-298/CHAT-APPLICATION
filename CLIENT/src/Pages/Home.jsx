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
    </div>
  )
}

export default Home
