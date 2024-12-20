import { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../service/authentication-service";
import AlertContext from "../context/AlertContext";
import ALERT_TYPES from "../constants/alertTypeConstants";
const Register = () => {
  const { addAlert } = useContext(AlertContext);
  const navigate = useNavigate();
  const [loading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    firstname: "",
    lastname: "",
    password: "",
  });

  const updateForm = (key, value) => {
    setForm((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };
  const handleSubmit = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      const response = await register(
        form.firstname,
        form.lastname,
        form.email,
        form.password
      );
      if (response) {
        // if registration is succesful
        setIsLoading(false);
        addAlert(
          "Register successful! Redirecting to login.",
          ALERT_TYPES.SUCCESS
        );
        navigate("/auth", { state: { auth: "login" } });
      }

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error("Registration failed:", error.message);

      addAlert(error.message);
    }
  };

  return (
    <div className="glass p-10 rounded">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
            className="grow "
            placeholder="Email"
            value={form.email}
            onChange={(e) => updateForm("email", e.target.value)}
          />
        </label>
        <label className="input input-bordered flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4 opacity-70"
          >
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
          </svg>
          <input
            type="text"
            className="grow"
            placeholder="Firstname"
            required
            value={form.firstname}
            onChange={(e) => updateForm("firstname", e.target.value)}
          />
        </label>
        <label className="input input-bordered flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4 opacity-70"
          >
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
          </svg>
          <input
            type="text"
            className="grow"
            placeholder="Lastname"
            required
            value={form.lastname}
            onChange={(e) => updateForm("lastname", e.target.value)}
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
            placeholder="Password"
            className="grow"
            required
            value={form.password}
            onChange={(e) => updateForm("password", e.target.value)}
          />
        </label>
        <p>
          Already have an account?{" "}
          <Link
            className="text-sky-700 hover:underline decoration-purple"
            to="/auth"
            state={{ auth: "login" }}
          >
            Sign in here
          </Link>{" "}
        </p>
        <button className="self-end" type="submit">
          {loading ? (
            <span className="loading loading-spinner loading-lg"></span>
          ) : (
            "Register"
          )}
        </button>
      </form>
    </div>
  );
};

export default Register;
