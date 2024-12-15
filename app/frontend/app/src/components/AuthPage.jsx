import { useLocation } from "react-router-dom";
import Register from "./Register";
import Login from  './Login'
const AuthPage = () => {
  const location = useLocation();
  const isLogginOrRegister = location.state.auth;

  if (isLogginOrRegister === "register") {
        return <Register/>
  } else if (isLogginOrRegister === "login") {
       return <Login/>
  }
};

export default AuthPage;
