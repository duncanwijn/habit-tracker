const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const signup = async (username, email, password) => {
    try {
        await fetch(`${API_URL}/api/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });
        return await login(username, password);
    } catch (error) {
        console.error('Error during signup:', error);
        throw error;
    }
};

export const login = async (username, password) => {
    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (!response.ok && response.status === 401) {
            throw new Error('Invalid username or password');
        }
        if (!response.ok) throw new Error('Login failed');
        return await response.json();
    } catch (error) {
        console.error('Error during login:', error);
        throw error;
    }
};