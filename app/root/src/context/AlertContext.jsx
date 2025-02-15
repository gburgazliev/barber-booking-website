import { createContext } from "react";



/**
 * @typedef {Object} AlertContextValue
 * @property {Array} alerts - The current alerts.
 * @property {(message: string, type?: string, position?: string, toast?: boolean, allowOutsideClick?: boolean, showConfirmButton?: boolean, timer?: number) => void} addAlert - Function to add an alert.
 * @property {(id: string) => void} removeAlert - Function to remove an alert.
 */

/** @type {React.Context<AlertContextValue>} */
const AlertContext = createContext(null);
export default AlertContext;