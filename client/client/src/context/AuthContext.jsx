import { createContext, useContext, useState, useEffect } from 'react';
import { login, signup } from '../api/authService';
import apiClient from '../api/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  console.log('[AuthProvider] rendering');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if a user session exists when the app first loads
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    console.log('[AuthProvider] init, token found:', !!savedToken);
    if (savedToken) {
      apiClient.get('/api/user')
        .then(response => response.json())
        .then(data => setUser(data.user))
        .catch(error => console.error('Error fetching user data:', error));
    }
    setLoading(false);
  }, []);

  const loginUser = async (email, password) => {
    const data = await login(email, password);
    setUser(data.user);
    localStorage.setItem('token', data.token); // Persist session
    
  };

  const signupUser = async (name, email, password) => {
    const data = await signup(name, email, password);
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, signupUser, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook for clean imports in UI files
export const useAuth = () => useContext(AuthContext);
