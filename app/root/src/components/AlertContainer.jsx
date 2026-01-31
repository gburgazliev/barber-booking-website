import { useContext, useEffect, useState } from "react";
import AlertContext from "../context/AlertContext";
import Swal from "sweetalert2";
import ALERT_TYPES from "../constants/alertTypeConstants";
const AlertContainer = () => {
  const { alerts, removeAlert } = useContext(AlertContext);
  const [queue, setQueue] = useState([]);
  const [isDisplaying, setIsDisplaying] = useState(false);

  useEffect(() => {
    if (alerts.length > 0) {
      setQueue((prevQueue) => [...prevQueue, alerts[alerts.length - 1]]);
      removeAlert(alerts[alerts.length - 1].id);
    }
  }, [alerts, removeAlert]);

  useEffect(() => {
    const displayNext = async () => {
      if (queue.length > 0 && !isDisplaying) {
        setIsDisplaying(true);
        const alert = queue[0];
       
        try {
          switch (alert.type) {
            case ALERT_TYPES.ERROR:
              await Swal.fire({
                icon: "error",
                title: "Error",
                text: alert.text,
                timer: alert.timer,
                timerProgressBar: true,
                showConfirmButton: alert.showConfirmButton,
                allowOutsideClick: alert.allowOutsideClick,
                toast: alert.toast,
                position: alert.position,
              });
              break;
            case ALERT_TYPES.SUCCESS:
              await Swal.fire({
                icon: "success",
                title: "Success",
                text: alert.text,
                timer: alert.timer,
                timerProgressBar: true,
                showConfirmButton: alert.showConfirmButton,
                allowOutsideClick: alert.allowOutsideClick,
                toast: alert.toast,
                position: alert.position,
              });
              break;

            default:
              await Swal.fire({
                icon: "info",
                text: alert.text,
                timer: alert.timer,
                timerProgressBar: true,
                position: alert.position,
                showConfirmButton: alert.showConfirmButton,
                allowOutsideClick: alert.allowOutsideClick,
                backdrop: "rgb(0, 0, 0, 0.3)",
              });
          }
        } finally {
          setQueue((prevQueue) => prevQueue.slice(1));
          setIsDisplaying(false);
        }
      }
    };
    displayNext();
  }, [queue, isDisplaying]);

  return null;
};

export default AlertContainer;
