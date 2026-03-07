import React from 'react';
import { useWardrobeStore } from '../../store/wardrobeStore';

const ActiveFiltersBar: React.FC = () => {
    const { filters, setFilters, clearFilters } = useWardrobeStore();

    const activeFilters = Object.entries(filters).filter(([_, value]) => value !== null);

    if (activeFilters.length === 0) return null;

    return (
        <div className="px-6 py-4 flex items-center space-x-3 overflow-x-auto no-scrollbar border-b border-gray-100 bg-white/50 backdrop-blur-sm">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] whitespace-nowrap mr-3">
                AKTİF FİLTRELER
            </span>

            {activeFilters.map(([key, value]) => (
                <span
                    key={key}
                    className="inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-800 capitalize shadow-sm transition-all hover:border-gray-300"
                >
                    {String(value)}
                    <button
                        type="button"
                        className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-md hover:bg-gray-100 text-gray-400 group transition-colors"
                        onClick={() => setFilters({ [key]: null })}
                    >
                        <span className="sr-only">Remove filter</span>
                        &times;
                    </button>
                </span>
            ))}

            <button
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-gray-900 ml-2 whitespace-nowrap font-medium"
            >
                Clear All
            </button>
        </div>
    );
};

export default ActiveFiltersBar;
