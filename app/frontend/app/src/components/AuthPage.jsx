import { useLocation } from "react-router-dom";
import Register from "./Register";
const AuthPage = () => {
  const location = useLocation();
  const isLogginOrRegister = location.state.auth;

  if (isLogginOrRegister === "register") {
        return <Register/>
  } else if (isLogginOrRegister === "login") {

  }
};

export default AuthPage;
