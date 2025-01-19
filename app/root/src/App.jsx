import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { useState, useEffect } from "react";
import HomeView from "./views/HomeView";
import AuthContext from "./context/AuthContext";
import Authentication from "./hoc/Authentication";
import AuthView from "./views/AuthView";
import AlertProvider from "./hoc/AlertProvider";
import AlertContainer from "./components/AlertContainer";
import ResetPasswordView from "./views/ResetPasswordView";
import NewPasswordView from "./views/NewPasswordView";
import clearUserData from "./helpers/clearUserData";
import { autoLogin } from "./service/authentication-service";
import LocationView from "./views/LocationView";


function App() {
  const [authValue, setAuthValue] = useState({ status: false, user: {} });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleAutoLogin = async () => {
      try {
        await autoLogin();

        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
          setAuthValue({ status: true, user: user });
          console.log("logged in as", user.email);
        } else {
          setAuthValue({ status: false, user: {} });
        }
      } catch (error) {
        console.error("Auto-login error:", error);
        setAuthValue({ status: false, user: {} });
      } finally {
        setIsLoading(false);
      }
    };
    handleAutoLogin();
  }, []);

  return (
    <AlertProvider>
      <AlertContainer />
      <BrowserRouter>
        <AuthContext.Provider
          value={{
            isLoggedIn: authValue,
            setIsLoggedIn: setAuthValue,
            isLoading,
            setIsLoading,
          }}
        >
          <Routes>
            <Route path="/auth" element={<AuthView />} />
            <Route path="/location" element={<LocationView />} />
            <Route path="/" element={<HomeView />} />
            <Route path="/reset-password" element={<ResetPasswordView />} />
            <Route
              path="/reset-password/:resetToken"
              element={<NewPasswordView />}
            />
          </Routes>
        </AuthContext.Provider>
      </BrowserRouter>
    </AlertProvider>
  );
}

export default App;
