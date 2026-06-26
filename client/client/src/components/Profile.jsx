import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import "./Profile.css";

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleClick = () => {
        if (user) {
            logout(); // Log out instantly if logged in
        } else {
            navigate("/login");
        }
    };

    return (
        <div className="navbar-user">
            <button 
                className={`profile-btn ${user ? 'logged-in' : 'logged-out'}`} 
                onClick={handleClick}
                /* Pass the username as a data attribute for CSS to access */
                data-username={user ? user.username : 'Login'}
            >
                {/* Wrap the text inside a span so we can hide/show it via CSS */}
                <span className="btn-text">{user ? user.username : 'Login'}</span>
            </button>
        </div>
    );
}
