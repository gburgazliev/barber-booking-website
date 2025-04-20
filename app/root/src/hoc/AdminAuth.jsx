import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

/**
 * A Higher Order Component (HOC) that checks if the user is authenticated
 * and has an admin role. If not, it redirects to the login page.
 */
const AdminAuth = ({ children }) => {
  const { isLoggedIn, isLoading } = useContext(AuthContext);
  const location = useLocation();
  
  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  
  // If not logged in or not an admin, redirect to login
  if (!isLoggedIn.status || isLoggedIn.user.role !== 'admin') {
    return (
      <Navigate 
        to="/auth" 
        state={{ 
          auth: "login", 
          from: location, 
          message: "You need admin access to view this page." 
        }} 
        replace={true} 
      />
    );
  }
  
  // If the user is logged in and has admin role, render the children
  return children;
};

export default AdminAuth;