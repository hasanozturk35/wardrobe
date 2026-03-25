import React from 'react';
import { NavigationDock } from './NavigationDock';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-transparent relative overflow-x-hidden">
            <main className="pb-32">
                {children}
            </main>
            <NavigationDock />
        </div>
    );
};
