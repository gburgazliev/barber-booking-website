import { useContext, useEffect } from "react";
import AuthContext from "../context/AuthContext";
import { autoLogin } from "../service/authentication-service";
import AlertContext from "../context/AlertContext";
import Calendar from "./Calendar";
import HomePhotosContainer from "./HomePhotosContainer";
const Home = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const { addAlert } = useContext(AlertContext);

  return (
    <div className="w-full pt-10  flex   items-center justify-evenly sm:flex-col md:flex-col lg:flex-row ">
     
     
      <Calendar />
      <HomePhotosContainer />
   
     </div>
  );
};
export default Home;
