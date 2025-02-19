import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
    useEffect(() => {
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

    const navigate = useNavigate() ; 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const email_change = (e) => {
        setEmail(e.target.value);
    };

    const password_change = (e) => {
        setPassword(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:4000/auth/login', { email, password } , {withCredentials : true});
            if(response.data.boolean) {
                // cookie already created and stored in browser !
                alert(response.data.message) ; 
                navigate('/dashboard') ; 
            }
            else{
                alert(response.data.message) ; 
                navigate('/') ; 
            }
        } catch (error) {
            console.error('Login Error:', error);
        }
    };

    return (
        <div>
            <h2>THIS IS THE LOGIN PAGE</h2>
            <form onSubmit={handleSubmit}>
                <p>EMAIL:</p>
                <input type="email" name="email" value={email} onChange={email_change} required />
                <p>PASSWORD:</p>
                <input type="password" name="password" value={password} onChange={password_change} required />
                <br />
                <button type="submit">LOGIN</button>
            </form>
        </div>
    );
};

export default Signup;
