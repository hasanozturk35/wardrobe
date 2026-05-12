export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const CATEGORY_FALLBACKS: Record<string, string> = {
    'Üst Giyim': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80',
    'Alt Giyim': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',
    'Dış Giyim': 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80',
    'Ayakkabı':  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    'Aksesuar':  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80',
    'default':   'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80',
};

export const getImageUrl = (url?: string, category?: string) => {
    if (!url) return CATEGORY_FALLBACKS[category || ''] ?? CATEGORY_FALLBACKS['default'];
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    if (url.startsWith('/')) return `${API_URL}${url}`;
    return `${API_URL}/${url}`;
};
