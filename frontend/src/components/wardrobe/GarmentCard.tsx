import React from 'react';
import type { GarmentItem } from '../../store/wardrobeStore';

interface GarmentCardProps {
    item: GarmentItem;
    onClick?: (item: GarmentItem) => void;
}

const GarmentCard: React.FC<GarmentCardProps> = ({ item, onClick }) => {
    const imageUrl = item.photos && item.photos.length > 0 ? item.photos[0].url : 'https://placehold.co/600x800/eeeeee/999999?text=No+Photo';

    return (
        <div
            onClick={() => onClick?.(item)}
            className="group relative rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
        >
            {/* 3:4 Aspect Ratio Container */}
            <div className="relative w-full pb-[133.33%] bg-gray-100">
                <img
                    src={imageUrl}
                    alt={item.category}
                    className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Pinned Badge */}
                {item.pinned && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-medium text-gray-800 shadow-sm">
                        Pinned
                    </div>
                )}
            </div>

            {/* Item info (Clean Look) */}
            <div className="p-3">
                <div className="flex justify-between items-start">
                    <div className="truncate">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{item.brand || 'No Brand'}</h3>
                        <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GarmentCard;
