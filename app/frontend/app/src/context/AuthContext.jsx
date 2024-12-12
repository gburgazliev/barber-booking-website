import { createContext, useContext } from "react";


 const AuthContext = createContext({
    isLoggedIn: {status: false, user: {}},
    setIsLoggedIn: () => {},
  });

  export default AuthContext;