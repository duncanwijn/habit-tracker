import './LoginPage.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SocialButton from '../components/SocialButton';
import googleLogo from '../assets/Google_Favicon_2025.svg.png';
import githubLogo from '../assets/GitHub_Invertocat_Black.png';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const navigate = useNavigate();
    const { loginUser } = useAuth();
    const [errorMsg, setErrorMsg] = useState('');
    
    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        const username = e.target[0].value;
        const password = e.target[1].value;

        try {
            await loginUser(username, password);
            navigate('/');
        } catch (error) {
            if (error.message === 'Invalid username or password') {
                setErrorMsg('Invalid username or password. Please try again.');
            } else {
                setErrorMsg('An error occurred during login. Please try again later.');
            }
            console.error('Login failed: status: ', error.response?.status, 'message: ', error.message);
        }
    };

    return (
        <div className="login-page-wrapper">
            <div className="login-page">
                <h2>Welcome Back!</h2>
                <form className="login-form" onSubmit={handleLogin}>
                    <input type="text" placeholder="Username" required />
                    <input type="password" placeholder="Password" required />
                    <button type="submit">Log In</button>
                    {errorMsg && <p className="invalid-credentials-message">{errorMsg}</p>}
                    <a href="#" className="forgot-password">Forgot password?</a>
                    <a href="#" className="signup-link" onClick={() => navigate("/signup")}>Don't have an account? Sign Up</a>
                    <div className="social-login">
                        <SocialButton provider="Google" logo={googleLogo} onClick={() => {}} />
                        <SocialButton provider="GitHub" logo={githubLogo} onClick={() => {}} />
                    </div>
                </form>
            </div>
        </div>
    );
}