import './Friends.css';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import apiClient from '../api/apiClient.jsx';
import { useNavigate } from 'react-router-dom';

export default function Friends() {

    const { user } = useAuth();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [friends, setFriends] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Fetch the user's actual friends list once on mount (or when user changes)
    useEffect(() => {
        if (!user) return;
        const fetchFriends = async () => {
            try {
                const response = await apiClient.get('/api/friends');
                if (!response.ok) throw new Error('Failed to fetch friends');
                const data = await response.json();
                setFriends(data.friends || []);
            } catch (error) {
                console.error('Error fetching friends:', error);
            }
        };
        fetchFriends();
    }, [user]);

    // Debounced user search — only runs when searchQuery changes
    useEffect(() => {
        if (!user || searchQuery.trim() === '') {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);

        const timer = setTimeout(async () => {
            try {
                const response = await apiClient.get(`/api/users?keywords=${encodeURIComponent(searchQuery)}`);
                if (!response.ok) throw new Error('Failed to fetch users');
                const data = await response.json();
                // Exclude users already in the friends list
                const friendIds = new Set(friends.map(f => f.id));
                setSearchResults((data.users || []).filter(u => !friendIds.has(u.id)));
            } catch (error) {
                console.error('Error searching users:', error);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery, user, friends]);

    return (
        <div className="friends-container">
            <button className="friends-btn" title="Friends" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <img src="https://img.icons8.com/ios-filled/50/000000/friends.png" alt="Friends" className="friends-icon" />
            </button>

            {isDropdownOpen && (
                <div className="friends-dropdown">
                    <div className="friends-dropdown-header">
                        <span>Friends</span>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            type="text"
                            placeholder="Search..."
                            className="friends-search"
                        />
                        <button className="close-btn" onClick={() => setIsDropdownOpen(false)}>×</button>
                    </div>

                    {!user && (
                        <div className="not-logged-in">
                            <button onClick={() => navigate('/login')}>Log In</button>
                        </div>
                    )}

                    {user && searchQuery.trim() === '' && (
                        friends.filter(f => f.status === 'accepted').length === 0
                            ? <div className="no-friends">You have no friends yet.</div>
                            : <ul className="friends-list">
                                {friends.filter(f => f.status === 'accepted').map(friend => (
                                    <li key={friend.id} className="friend-item">
                                        <span className="friend-item-name">{friend.username}</span>
                                    </li>
                                ))}
                            </ul>
                    )}

                    {user && searchQuery.trim() !== '' && isSearching && (
                        <div className="friends-searching">Searching...</div>
                    )}

                    {user && searchQuery.trim() !== '' && !isSearching && searchResults.length === 0 && (
                        <div className="no-friends">No users found.</div>
                    )}

                    {user && searchQuery.trim() !== '' && !isSearching && searchResults.length > 0 && (
                        <ul className="friends-list">
                            {searchResults.map(result => (
                                <li key={result.id} className="friend-item">
                                    <span className="friend-item-name">{result.username}</span>
                                    <button className="add-friend-btn" onClick={async () => {
                                        try {
                                            const response = await apiClient.post('/api/friends/request', { friendUsername: result.username });
                                            if (!response.ok) throw new Error('Failed to add friend');
                                            setFriends(prev => [...prev, result]);
                                            setSearchResults(prev => prev.filter(u => u.id !== result.id));
                                        } catch (error) {
                                            console.error('Error adding friend:', error);
                                        }
                                    }}>+</button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {user && searchQuery.trim() === '' && !isSearching && (
                        <ul className="requests-list">
                            {friends.filter(f => f.status === 'pending').map(request => (
                                <li key={request.id} className="friend-request-item">
                                    <span className="friend-request-name">{request.username}</span>
                                    <button className="accept-btn" onClick={async () => {
                                        try {
                                            const response = await apiClient.post('/api/friends/respond', { friendId: request.id, action: 'accept' });
                                            if (!response.ok) throw new Error('Failed to accept friend request');
                                            setFriends(prev => prev.map(f => f.id === request.id ? { ...f, status: 'accepted' } : f));
                                        } catch (error) {
                                            console.error('Error accepting friend request:', error);
                                        }
                                    }}>✓</button>
                                    <button className="decline-btn" onClick={async () => {
                                        try {
                                            const response = await apiClient.post('/api/friends/respond', { friendId: request.id, action: 'decline' });
                                            if (!response.ok) throw new Error('Failed to decline friend request');
                                            setFriends(prev => prev.filter(f => f.id !== request.id));
                                        } catch (error) {
                                            console.error('Error declining friend request:', error);
                                        }
                                    }}>✗</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
