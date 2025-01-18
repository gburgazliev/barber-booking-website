import { useContext, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AlertContext from "../context/AlertContext";
import Swal from "sweetalert2";
import ALERT_TYPES from "../constants/alertTypeConstants";
import("@sweetalert2/theme-dark/dark.css")
const AlertContainer = () => {
  const { alerts, removeAlert } = useContext(AlertContext);

  useEffect(() => {
    if (alerts.length > 0) {
      const latestAlert = alerts[alerts.length - 1];
      switch (latestAlert.type) {
        case ALERT_TYPES.ERROR:
          Swal.fire({
            icon: "error",
            title: "Error",
            text: latestAlert.text,
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
            toast: true,
            position: "top",
          });
          break;
        case ALERT_TYPES.SUCCESS:
          Swal.fire({
            icon: "success",
            title: "Success",
            text: latestAlert.text,
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
            toast: true,
            position: "top",
          });
          break;

        default:
          Swal.fire({
            icon: "info",
            text: latestAlert.text,
            
           
            position: "center",
           
            backdrop: "rgb(0, 0, 0, 0.3)",
          });
      }

      removeAlert(latestAlert.id);
    }
  }, [alerts, removeAlert]);

  return null;
};

export default AlertContainer;
