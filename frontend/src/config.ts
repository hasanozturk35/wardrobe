export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const CATEGORY_FALLBACKS: Record<string, string> = {
    'Üst Giyim': 'https://source.unsplash.com/ogmenj2NGho/600x800',
    'Alt Giyim': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',
    'Dış Giyim': 'https://source.unsplash.com/oB7lLU9dwLc/600x800',
    'Ayakkabı':  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    'Aksesuar':  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80',
    'default':   'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=80',
};

export const getImageUrl = (url?: string, category?: string) => {
    if (!url) return CATEGORY_FALLBACKS[category || ''] ?? CATEGORY_FALLBACKS['default'];
    if (url.startsWith('static')) return `${API_URL}/${url}`;
    if (url.startsWith('/static')) return `${API_URL}${url}`;
    return url;
};
