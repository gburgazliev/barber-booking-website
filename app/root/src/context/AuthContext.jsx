import { createContext, useContext } from "react";


 const AuthContext = createContext({
    isLoggedIn: {status: false, user: {}},
    setIsLoggedIn: () => {},
    isLoading: true,
    setIsLoading: () => {},
  });

  export default AuthContext;