import { useState, useContext } from "react";
import AlertContext from "../context/AlertContext";
import ALERT_TYPES from "../constants/alertTypeConstants";
import { SERVER_URL } from "../constants/serverUrl";
const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const { addAlert } = useContext(AlertContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(SERVER_URL("api/users/reset-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        addAlert("Reset email sent", ALERT_TYPES.SUCCESS, undefined, true, undefined, false);
      } else {
        const parseResponse = await response.json();
        addAlert(parseResponse.message, undefined, undefined, true, undefined, false);
      }
    } catch (error) {
      addAlert(error.message, undefined, undefined, true, undefined, false);
    }
  };

  return (
    <form action="" className="flex flex-col gap-2" onSubmit={handleSubmit}>
     
      <label className="input input-bordered flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-4 w-4 opacity-70"
        >
          <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
          <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
        </svg>
        <input
          type="text"
          className="grow"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <button className="btn self-end">Submit </button>
    </form>
  );
};

export default ResetPassword;
