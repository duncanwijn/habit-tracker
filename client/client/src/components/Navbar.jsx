import "./Navbar.css"
import { Link, useNavigate } from 'react-router-dom';
import Profile from './Profile.jsx';

export default function Navbar() {
    const navigate = useNavigate();

    return (
        <nav className="navbar">
            {/* Brand Logo/Name */}
            <div className="navbar-logo">
                🔥 <span>Habitify</span>
            </div>

            <ul className="navbar-links">
                <li><Link to="/habit-manager">Habit Manager</Link></li>
                <li><Link to="/progress-tracker">Progress Tracker</Link></li>
                <li><Link to="/analytics-dashboard">Analytics Dashboard</Link></li>
                <li><Link to="/settings">Settings</Link></li>
            </ul>

            {/* Right Side Utility (e.g., Profile or Action Button) */}
            <Profile />
        </nav>
    )
}