import { useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AlertContext from "../context/AlertContext";
import ALERT_TYPES from "../constants/alertTypeConstants";

const AlertContainer = () => {
  const { alerts, removeAlert } = useContext(AlertContext);
  const alertVariants = {
    hidden: {
      opacity: 0,
      x: 0,
      y: 0,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 50,
      transition: { duration: 0.5 },
    },
    exit: {
      opacity: 0,
      x: 0,
      y: -100,
      transition: { duration: 1 },
    },
  };

  return (
    <motion.div
      layout
      className="flex flex-col w-64 text-sm gap-5  fixed top-10 right-10 z-[999]"
    >
      <AnimatePresence>
        {alerts.map((alert) => {
          switch (alert.type) {
            case ALERT_TYPES.ERROR: {
              return (
                <motion.div
                  layout
                  variants={alertVariants}
                  role="alert"
                  key={alert.id}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="alert alert-error "
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 shrink-0 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>

                  <span>{alert.text}</span>
                </motion.div>
              );
            }
            case ALERT_TYPES.SUCCESS: {
              return (
                <motion.div
                  role="alert"
                  key={alert.id}
                  className="alert alert-success"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 shrink-0 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{alert.text}</span>
                </motion.div>
              );
            }
          }
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export default AlertContainer;
