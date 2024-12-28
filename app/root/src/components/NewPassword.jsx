import { useContext, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { newPasswordRequest } from "../service/newPassword-service";
import ALERT_TYPES from "../constants/alertTypeConstants";
import AlertContext from "../context/AlertContext";
import updateForm from "../helpers/updateForm";

const NewPassword = () => {
  const { resetToken } = useParams();
  const { addAlert } = useContext(AlertContext);
  const [form, setForm] = useState({ newPassword: "", confirmNewPassword: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();

      if (form.newPassword !== form.confirmNewPassword) {
        throw new Error("Passwords in the fields should match !");
      }
      const response = await newPasswordRequest(resetToken, form.newPassword);
      if (response) {
        addAlert(response.message, ALERT_TYPES.SUCCESS);
        navigate("/auth", { state: { auth: "login" } });
      }
    } catch (error) {
      addAlert(error.message);
    }
  };

  return (
    <form className="flex flex-col gap-5 p-10 bg-black" onSubmit={handleSubmit}>
      <label className="input input-bordered flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-4 w-4 opacity-70"
        >
          <path
            fillRule="evenodd"
            d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="password"
          placeholder="New password"
          className="grow"
          required
          value={form.newPassword}
          onChange={(e) => updateForm("newPassword", e.target.value, setForm)}
        />
      </label>

      <label className="input input-bordered flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-4 w-4 opacity-70"
        >
          <path
            fillRule="evenodd"
            d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="password"
          placeholder="Confirm new password"
          className="grow"
          required
          value={form.confirmNewPassword}
          onChange={(e) =>
            updateForm("confirmNewPassword", e.target.value, setForm)
          }
        />
      </label>

      <button>Submit</button>
    </form>
  );
};

export default NewPassword;
