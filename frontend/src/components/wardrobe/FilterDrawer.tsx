import React, { useState } from 'react';
import { useWardrobeStore } from '../../store/wardrobeStore';
import { Filter, X } from 'lucide-react';

const CATEGORIES = ['T-Shirt', 'Shirt', 'Sweater', 'Jacket', 'Pants', 'Jeans', 'Shorts', 'Dress', 'Skirt', 'Shoes', 'Sneakers'];

const FilterDrawer: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { filters, setFilters } = useWardrobeStore();

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none transition-colors"
            >
                <Filter className="w-6 h-6" />
            </button>

            {/* Drawer Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer Content */}
            <div
                className={`fixed inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-xl font-medium text-gray-900">Filters</h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Filters */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 mb-5 tracking-widest uppercase">KATEGORİLER</h3>
                            <div className="flex flex-wrap gap-3">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilters({ category: filters.category === cat ? null : cat })}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${filters.category === cat
                                            ? 'bg-black text-white shadow-xl scale-105'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-4">
                        <button
                            onClick={() => { setFilters({ category: null, color: null }); setIsOpen(false); }}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            Reset
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="flex-1 px-4 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 shadow-md transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FilterDrawer;
