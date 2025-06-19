import { createContext, useContext } from "react";


 const AuthContext = createContext({
  isLoggedIn: { status: false, user: {} },
  setIsLoggedIn: () => {},
  isLoading: true,
  setIsLoading: () => {},
  refreshUserData: () => {},
  clearAuth: () => {},
});

  export default AuthContext;