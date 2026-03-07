export const API_URL = 'http://localhost:3000';

export const getImageUrl = (url?: string) => {
    if (!url) return 'https://placehold.co/400x533?text=Kiyafet';
    if (url.startsWith('static')) return `${API_URL}/${url}`;
    if (url.startsWith('/static')) return `${API_URL}${url}`;
    return url;
};
