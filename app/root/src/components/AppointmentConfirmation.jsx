import { useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { SERVER_URL } from "../constants/serverUrl";
import ALERT_TYPES from "../constants/alertTypeConstants";
import AlertContext from "../context/AlertContext";
import AuthContext from "../context/AuthContext";
const AppointmentConfirmation = () => {
  const { addAlert } = useContext(AlertContext);
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
  let { confirmationToken } = useParams();
  confirmationToken = confirmationToken.slice(1);
  // const fetchUpdatedUserData = async () => {
  //   try {
  //     const response = await fetch(SERVER_URL("api/users/login"), {
  //       method: "GET",
  //       credentials: "include",
  //       mode: "cors",
  //     });

  //     if (response.ok) {
  //       const body = await response.json();
  //       setIsLoggedIn({ status: true, user: body.user });
  //     }
  //   } catch (error) {
  //     console.error("Error fetching updated user data:", error);
  //   }
  // };

  useEffect(() => {
    const confirmAppointment = async () => {
      const response = await fetch(
        SERVER_URL(`api/appointments/confirmation/:${confirmationToken}`),
        {
          method: "GET",
        }
      );
      const data = await response.json();
      if (!response.ok) {
       addAlert(data.message, ALERT_TYPES.INFO ,'center', false, false, false, null);
       return;
      }
      addAlert(data.message, ALERT_TYPES.SUCCESS, 'center', false, false, false, null)
      // if (isLoggedIn.status) {
      //   await fetchUpdatedUserData();
      // }
    };

    confirmAppointment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

export default AppointmentConfirmation;
