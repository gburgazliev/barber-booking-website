import { useState } from "react";
import { login } from "../service/authentication-service";
import { useNavigate, useLocation, Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { useContext } from "react";
import ALERT_TYPES from "../constants/alertTypeConstants";
import AlertContext from "../context/AlertContext";
import updateForm from "../helpers/updateForm";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setIsLoading] = useState(false);
  const { setIsLoggedIn, isLoggedIn } = useContext(AuthContext);
  const { addAlert } = useContext(AlertContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      const user = await login(form.email, form.password);

      if (user) {
        setIsLoggedIn({ status: true, user: { ...user } });
  
        addAlert("Login successful!", ALERT_TYPES.SUCCESS, undefined, true, undefined, false);

        if (user.role === "admin") {
          addAlert("Welcome Admin!", ALERT_TYPES.SUCCESS, undefined, true, undefined, false);
          console.log("Admin logged in", user);
          navigate("/admin");
        } else {
          navigate(location?.from?.pathname || "/");
        }
        
      }
    } catch (error) {
      addAlert(`Error signing in: ${error.message}`, undefined, undefined, true, undefined, false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass p-10 rounded">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            onChange={(e) => updateForm("email", e.target.value, setForm)}
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
            onChange={(e) => updateForm("password", e.target.value, setForm)}
          />
        </label>
        <p>
          Forgot your password ?{" "}
          <Link
            className="text-purple-700 hover:underline decoration-purple"
            to={"/reset-password"}
          >
            Reset here
          </Link>
        </p>

        <p>
          Don't have an account ?{" "}
          <Link
            className="text-purple-700 hover:underline decoration-purple"
            to="/auth"
            state={{ auth: "register" }}
          >
            Register here
          </Link>{" "}
        </p>
        <button className="self-end" type="submit">
          {loading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            "Login"
          )}
        </button>
      </form>
    </div>
  );
};

export default Login;
