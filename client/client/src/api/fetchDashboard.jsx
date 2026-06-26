import apiClient from './apiClient';

export const fetchDashboardData = async (token) => {
    try {
        const response = await apiClient.get('/api/dashboard')
        if (!response.ok && response.status !== 401) {
            throw new Error('Failed to fetch dashboard data');
        } else if (response.status === 401) {
            console.warn('Unauthorized access to dashboard data');
            return { message: 'Unauthorized', secretData: null, user: null };
        }
        const data = await response.json();
        const { message, secretData, user } = data;
        return { message, secretData, user };
    }
    catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
    }
};