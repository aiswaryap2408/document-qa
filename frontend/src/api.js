import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // FastAPI Backend

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 120000, // 120 seconds timeout (astrology reports and RAG can be slow)
    headers: {
        'Content-Type': 'application/json',
    },
});

export const sendOtp = (mobile) => api.post('/auth/send-otp', { mobile });
export const verifyOtp = (mobile, otp) => api.post('/auth/verify-otp', { mobile, otp });
export const registerUser = (data) => api.post('/auth/register', data);

export const sendMessage = (mobile, message, history, sessionId) => api.post('/auth/chat', { mobile, message, history, session_id: sessionId });
export const endChat = (mobile, history, sessionId) => api.post('/auth/end-chat', { mobile, history, session_id: sessionId });
export const getChatHistory = (mobile) => api.get(`/auth/history/${mobile}`);
export const submitFeedback = (data) => api.post('/auth/feedback', data);

// Admin Endpoints
export const adminLogin = (username, password) => api.post('/admin/login', { username, password });
export const getAllUsers = () => api.get('/admin/users');
export const getUserDetails = (mobile) => api.get(`/admin/user-details/${mobile}`);
export const getSystemPrompt = () => api.get('/admin/system-prompt');
export const updateSystemPrompt = (prompt) => api.post('/admin/system-prompt', { prompt });

export const getMayaPrompt = () => api.get('/admin/maya-prompt');
export const updateMayaPrompt = (prompt) => api.post('/admin/maya-prompt', { prompt });

// Chat Tester Endpoints
export const testUpload = (formData) => api.post('/admin/test-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const testProcess = (filename) => {
    const formData = new FormData();
    formData.append('filename', filename);
    return api.post('/admin/test-process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const testChat = (message, docId, model = "gpt-4o-mini") => api.post('/admin/test-chat', { message, doc_id: docId, model });

// Wallet Endpoints
export const getWalletStatus = () => api.get('/wallet/status');
export const getBalance = (mobile) => api.get(`/wallet/balance/${mobile}`);
export const getTransactionHistory = (mobile) => api.get(`/wallet/history/${mobile}`);
export const rechargeWallet = (data) => api.post('/wallet/recharge', data);
export const toggleWalletSystem = (enabled) => api.post(`/wallet/toggle-system?enabled=${enabled}`);
export const getDashboardStats = () => api.get('/admin/stats');

export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

export default api;
