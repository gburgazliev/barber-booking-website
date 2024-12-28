import { useContext , useEffect} from "react";
import AuthContext from "../context/AuthContext";
import { autoLogin } from "../service/authentication-service";
const Home = () => {
  const { isLoggedIn } = useContext(AuthContext);

  

  return (
    <div>
      <h1>Home page</h1>
      <a href="">sadadsd</a>
    </div>
  );
};
export default Home;
