import axios from 'axios';

const API_BASE_URL = 'http://localhost:8088'; // FastAPI Backend

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // 60 seconds timeout (astrology reports can be slow)
    headers: {
        'Content-Type': 'application/json',
    },
});

export const sendOtp = (mobile) => api.post('/auth/send-otp', { mobile });
export const verifyOtp = (mobile, otp) => api.post('/auth/verify-otp', { mobile, otp });
export const registerUser = (data) => api.post('/auth/register', data);

export const sendMessage = (mobile, message, history) => api.post('/auth/chat', { mobile, message, history });
export const endChat = (mobile, history) => api.post('/auth/end-chat', { mobile, history });

export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

export default api;
