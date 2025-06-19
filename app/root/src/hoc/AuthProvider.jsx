import React, { useState, useEffect, useCallback, useMemo } from "react";
import AuthContext from "../context/AuthContext";
import { SERVER_URL } from "../constants/serverUrl";





export const AuthProvider = ({ children }) => {
    const [authValue, setAuthValue] = useState({ status: false, user: {} });
    const [isLoading, setIsLoading] = useState(true);
  
    // Clear authentication state
    const clearAuth = useCallback(() => {
      setAuthValue({ status: false, user: {} });
      localStorage.removeItem("user");
      sessionStorage.clear();
    }, []);
  
    // Memoized refresh function to prevent unnecessary re-renders
    const refreshUserData = useCallback(async () => {
      if (!authValue.status) return null;
      
      try {
        const response = await fetch(SERVER_URL("api/users/login"), {
          method: "GET",
          credentials: "include",
          mode: "cors",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });
  
        if (response.ok) {
          const body = await response.json();
          const newUser = body.user;
          
          // Only update state if user data actually changed
          setAuthValue(prev => {
            const hasChanged = JSON.stringify(prev.user) !== JSON.stringify(newUser);
            if (hasChanged) {
              localStorage.setItem("user", JSON.stringify(newUser));
              return { status: true, user: newUser };
            }
            return prev;
          });
          
          return newUser;
        } else {
          // If refresh fails, clear auth state
          clearAuth();
          return null;
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
        clearAuth();
        return null;
      }
    }, [authValue.status, clearAuth]);
  
    // Auto-login effect
    useEffect(() => {
      const autoLogin = async () => {
        try {
          // First check localStorage for existing user
          const storedUser = localStorage.getItem("user");
        
          if (storedUser) {
            const user = JSON.parse(storedUser);
            setAuthValue({ status: true, user });
           
          }
  
          // Then verify with server
          const response = await fetch(SERVER_URL("api/users/login"), {
            method: "GET",
            credentials: "include",
            mode: "cors",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
            },
          });
  
          if (response.ok) {
            const body = await response.json();
            const user = body.user;
            localStorage.setItem("user", JSON.stringify(user));
            setAuthValue({ status: true, user });
          } else {
            clearAuth();
          }
        } catch (error) {
          console.error("Auto-login failed:", error);
          clearAuth();
        } finally {
          setIsLoading(false);
        }
      };
  
      autoLogin();
    }, [clearAuth]);
  
    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
      isLoggedIn: authValue,
      setIsLoggedIn: setAuthValue,
      isLoading,
      setIsLoading,
      refreshUserData,
      clearAuth,
    }), [authValue, isLoading, refreshUserData, clearAuth]);
  
    return (
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    );
  };