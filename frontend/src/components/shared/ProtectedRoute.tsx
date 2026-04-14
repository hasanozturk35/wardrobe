import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { token } = useAuthStore();
    const location = useLocation();

    if (!token) {
        // Redirect them to the /auth page, but save the current location they were trying to go to
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
