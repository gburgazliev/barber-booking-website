import { createContext, useContext } from "react";
import { SERVER_URL } from "../constants/serverUrl";
import { useState, useEffect } from "react";
import { Form, Navigate, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const Authentication = ({ children }) => {
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
  const [loading, setIsLoading] = useState(false);
  const location = useLocation();

  // automatically login the user if there is a valid cookie
  useEffect(() => {
    if (!isLoggedIn.status) {
      (async () => {
        setIsLoading(true);
        try {
          const response = await fetch(SERVER_URL("api/users/login"), {
            method: "GET",
            credentials: "include",
            mode: "cors",
          });

          if (response.ok) {
            const body = await response.json();

            setIsLoggedIn({ status: true, user: body.user._doc });
          }
          setIsLoading(false);
        } catch (error) {
          console.log("Auto-login failed:", error.message);
          setIsLoading(false);
        }
      })();
    }
  }, []);

  if (loading) {
    return <div>Loading....</div>;
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

export default Authentication;
