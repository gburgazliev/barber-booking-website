import ALERT_ACTIONS from "../constants/alertActionsConstants";

const alertReducer = (alerts, action) => {
  switch (action.type) {
    case ALERT_ACTIONS.ADD_ALERT: {
      return [
        ...alerts,
        {
          id: action.payload.id,
          text: action.payload.message,
          type: action.payload.type
        },
      ];
    }
    case ALERT_ACTIONS.REMOVE_ALERT: {
      return alerts.filter((alert) => alert.id !== action.payload);
    }
  }
};

export default alertReducer;
