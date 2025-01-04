import { useContext , useEffect} from "react";
import AuthContext from "../context/AuthContext";
import { autoLogin } from "../service/authentication-service";
import AlertContext from "../context/AlertContext";
const Home = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const {addAlert} = useContext(AlertContext);

 
  return (
    <div>
      <h1>Home page</h1>
      <a href="">sadadsd</a>
    </div>
  );
};
export default Home;
