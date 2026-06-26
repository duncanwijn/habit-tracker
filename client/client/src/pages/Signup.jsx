import './Signup.css';
import { useNavigate } from 'react-router-dom';
import SocialButton from '../components/SocialButton';
import googleLogo from '../assets/Google_Favicon_2025.svg.png';
import githubLogo from '../assets/GitHub_Invertocat_Black.png';
import { useAuth } from '../context/AuthContext';


export default function Signup() {
    const navigate = useNavigate();
    const { signupUser } = useAuth();

    const handleSignup = async (e) => {
        e.preventDefault();
        const username = e.target[0].value;
        const email = e.target[1].value;
        const password = e.target[2].value;

        try {
            await signupUser(username, email, password);
            navigate('/'); // Redirect to dashboard after successful signup
        } catch (error) {
            console.error('Signup failed:', error);
        }
    };

    return (
        <div className="signup-page-wrapper">
            <div className="signup-page">
                <h2>Create Your Account</h2>
                <form className="signup-form" onSubmit={handleSignup}>
                    <input type="text" placeholder="Username" required />
                    <input type="email" placeholder="Email" required />
                    <input type="password" placeholder="Password" required />
                    <button type="submit">Sign Up</button>
                    <a href="#" className="login-link" onClick={() => navigate("/login")}>Already have an account? Log In</a>
                </form>
                <div className="social-signup">
                    <SocialButton provider="Google" logo={googleLogo} onClick={() => {}} />
                    <SocialButton provider="GitHub" logo={githubLogo} onClick={() => {}} />
                </div>
            </div>
        </div>
    );
}
