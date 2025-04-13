import { useContext , useEffect} from "react";
import AuthContext from "../context/AuthContext";
import { autoLogin } from "../service/authentication-service";
import AlertContext from "../context/AlertContext";
import Calendar from "./Calendar";
const Home = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const {addAlert} = useContext(AlertContext);

 
  return (
    <div className='w-full  flex flex-col items-center justify-center'>
      <h1>Home page</h1>
      <Calendar/>
      <a href="">sadadsd</a>
    </div>
  );
};
export default Home;
