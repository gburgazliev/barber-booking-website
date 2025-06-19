import { createContext, useContext } from "react";
import { SERVER_URL } from "../constants/serverUrl";
import { useState, useEffect } from "react";
import { Form, Navigate, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { useCallback } from "react";
 


const Authentication = ({ children }) => {
  const { isLoggedIn, isLoading } = useContext(AuthContext);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg"></span>
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn.status) {
    return (
      <Navigate
        to="/auth"
        state={{ auth: "login", from: location }}
        replace={true}
      />
    );
  }

  return <>{children}</>;
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Custom hook for user actions that might change user state
export const useUserActions = () => {
  const { refreshUserData } = useAuth();

  // Call this after any action that might change user data
  const afterUserAction = useCallback(async (actionCallback) => {
   const result = await actionCallback();
      // Refresh user data after successful action
       refreshUserData();
      return result;
    
    
  }, [refreshUserData]);

  return { afterUserAction, refreshUserData };
};




export default Authentication;
