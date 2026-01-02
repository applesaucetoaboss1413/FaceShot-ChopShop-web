import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
    const telegramUser = localStorage.getItem('telegram_user');
    if (telegramUser) {
        const user = JSON.parse(telegramUser);
        // Add telegram_user_id to params for GET, or body for POST if not already there
        if (config.method === 'get') {
            config.params = { ...config.params, telegram_user_id: user.id };
        } else if (config.method === 'post') {
            // Only inject if it's a JSON body (skip FormData)
            if (!(config.data instanceof FormData)) {
                config.data = { ...config.data, telegram_user_id: user.id };
            }
        }
    }
    return config;
});

export const getPacks = () => api.get('/api/web/packs');
export const getCatalog = () => api.get('/api/web/catalog');
export const getStats = () => api.get('/stats');
export const createCheckoutSession = (packType) => api.post('/api/web/checkout', { pack_type: packType });
export const getCredits = () => api.get('/api/miniapp/credits');
export const getCreations = () => api.get('/api/miniapp/creations');
export const uploadFile = (file, type, telegramUserId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('telegram_user_id', telegramUserId);
    return api.post('/api/miniapp/upload', formData);
};
export const processJob = (type) => api.post('/api/miniapp/process', { type });
export const getJobStatus = (id) => api.get(`/api/miniapp/status?id=${id}`);

export default api;
