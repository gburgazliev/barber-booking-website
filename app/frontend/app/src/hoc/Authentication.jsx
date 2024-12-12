import { createContext, useContext } from "react";
import { SERVER_URL } from "../constants/serverUrl";
import { useState, useEffect } from "react";
import AuthContext from "../context/AuthContext";

const Authentication = ({ children }) => {
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
  const [loading, setIsLoading] = useState(true);

  // automatically login the user if there is a valid cookie
  useEffect(() => {
   
    
      (async () => {
        try {
          const response = await fetch(SERVER_URL("api/users/login"), {
            method: "GET",
            credentials: "include",
            mode: "cors",
          });

          if (response.ok) {
            const body = await response.json();
            setIsLoggedIn({ isLoggedIn: true, user: body.user });
             setIsLoading(false);
          }
         
        } catch (error) {
          console.log("Auto-login failed:", error.message);
          setIsLoading(false)
        }
      })();
    
  }, []);

 useEffect(() => {
 console.log(isLoggedIn)
 }, [isLoggedIn])

  if (loading) {
    return <div>Loading....</div>;
  }

  return <>{children}</>;
};

export default Authentication;
