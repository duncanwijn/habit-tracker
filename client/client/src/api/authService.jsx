const API_URL = 'http://localhost:3000/api';

export const signup = async (username, email, password) => {
    try {
        await fetch(`${API_URL}/signup`, {
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
        const response = await fetch(`${API_URL}/login`, {
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