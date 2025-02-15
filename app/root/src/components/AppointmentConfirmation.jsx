import { useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { SERVER_URL } from "../constants/serverUrl";
import ALERT_TYPES from "../constants/alertTypeConstants";
import AlertContext from "../context/AlertContext";
const AppointmentConfirmation = () => {
  const { addAlert } = useContext(AlertContext);
  let { confirmationToken } = useParams();
  confirmationToken = confirmationToken.slice(1);
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
      
    };

    confirmAppointment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

export default AppointmentConfirmation;
