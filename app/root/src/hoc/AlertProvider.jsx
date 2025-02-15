import { useReducer } from "react";
import alertReducer from "../helpers/alertReducer";
import AlertContext from "../context/AlertContext";
import ALERT_TYPES from "../constants/alertTypeConstants";
import ALERT_ACTIONS from "../constants/alertActionsConstants";

const AlertProvider = ({ children }) => {
  const [alerts, dispatch] = useReducer(alertReducer, []);

  const removeAlert = (id) => {
    dispatch({
      type: ALERT_ACTIONS.REMOVE_ALERT,
      payload: id,
    });
  };
/**
 * 
 * @param {string} message 
 * @param {string} type 
 * @param {string} position top
 * @param {boolean} toast true
 * @param {boolean} allowOutsideClick true 
 * @param {boolean} showConfirmButton true 
 */
  const addAlert = (message , type = ALERT_TYPES.ERROR, position = 'top', toast = true, allowOutsideClick = true, showConfirmButton = true, timer = 3000) => {
    const id = new Date().getMilliseconds().toString();
    dispatch({
      type: ALERT_ACTIONS.ADD_ALERT,
      payload: { message, type, id , position, toast, allowOutsideClick, showConfirmButton, timer},
    });

    
  };

  return (
    <AlertContext.Provider value={{ alerts, addAlert, removeAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export default AlertProvider;
