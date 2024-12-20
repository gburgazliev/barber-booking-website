import { createContext } from "react";

/**
 * @typedef {Object} AlertContextValue
 * @property {Array} alerts - The current alerts.
 * @property {Function} addAlert - Function to add an alert.
 * @property {Function} removeAlert - Function to remove an alert.
 */

/** @type {React.Context<AlertContextValue>} */
const AlertContext = createContext(null);
export default AlertContext;