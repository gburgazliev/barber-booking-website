import { useContext, useEffect, useRef } from "react";
import AuthContext from "../context/AuthContext";
import { autoLogin } from "../service/authentication-service";
import AlertContext from "../context/AlertContext";
import Calendar from "./Calendar";
import HomePhotosContainer from "./HomePhotosContainer";
import Preview from "./Preview/Preview";
const Home = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const { addAlert } = useContext(AlertContext);
  const calendarRef = useRef(null);

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* Pass scroll function to Preview component */}
      <Preview />
      
      {/* Calendar section */}
      <div id="calendar-section" ref={calendarRef} className="my-16 w-full pt-10  flex   items-center justify-evenly sm:flex-col md:flex-col lg:flex-row">
        
          <Calendar />
       <HomePhotosContainer />
      </div>
    </div>
  );
};

export default Home;