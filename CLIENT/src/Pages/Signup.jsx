import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
    useEffect(() => {
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
    const navigate = useNavigate() ;
    const [image,setImage] = useState('') ;  
    const [name,setName] = useState('') ; 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const name_change = (e) => {
        setName(e.target.value) ; 
    }
    const image_change = (e) => {
        setImage(e.target.value) ; 
    }
    const email_change = (e) => {
        setEmail(e.target.value);
    };
    const password_change = (e) => {
        setPassword(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('https://chat-application-ke4k.onrender.com/auth/signup', { image , name , email, password } , {withCredentials : true});
            if(response.data.boolean) {
                alert(response.data.message) ; 
                navigate('/login') ; 
            } 
            else{
                alert(response.data.message) ; 
            }
        } catch (error) {
            console.error('Signup Error:', error);
            alert("INTERNAL SERVER ERROR") ; 
        }
    };

    return (
        <div>
            <h2>THIS IS THE SIGNUP PAGE</h2>
            <form onSubmit={handleSubmit}>
                <p>IMAGE</p>
                <input type="text" name="image" value={image} onChange={image_change} required/> 
                <p>Name</p>
                <input type="text" name="name" value={name} onChange={name_change} required/> 
                <p>EMAIL:</p>
                <input type="email" name="email" value={email} onChange={email_change} required />
                <p>PASSWORD:</p>
                <input type="password" name="password" value={password} onChange={password_change} required />
                <br />
                <button type="submit">Sign Up</button>
            </form>
        </div>
    );
};

export default Signup;
