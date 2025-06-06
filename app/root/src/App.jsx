import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { useState, useEffect } from "react";
import HomeView from "./views/HomeView";
import AuthContext from "./context/AuthContext";
import Authentication from "./hoc/Authentication";
import AuthView from "./views/AuthView";
import AlertProvider from "./hoc/AlertProvider";
import PricesProvider from "./hoc/PricesProvider";
import AlertContainer from "./components/AlertContainer";
import ResetPasswordView from "./views/ResetPasswordView";
import NewPasswordView from "./views/NewPasswordView";
import clearUserData from "./helpers/clearUserData";
import { autoLogin } from "./service/authentication-service";
import LocationView from "./views/LocationView";
import AppointmentConfirmation from "./components/AppointmentConfirmation";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import ProfileView from "./views/ProfileView";

import AdminAuth from "./hoc/AdminAuth";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./components/AdminDashboard";
import AppointmentManagement from "./components/AppointmentManagement";
import PriceManagement from "./components/PriceManagement";
import ScheduleManagement from "./components/ScheduleManagement";
import UserManagement from "./components/UserManagement";

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
          <PricesProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Routes>
              <Route
                path="/admin"
                element={
                  <AdminAuth>
                    <AdminLayout />
                  </AdminAuth>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route
                  path="appointments"
                  element={<AppointmentManagement />}
                />
                <Route path="schedule" element={<ScheduleManagement />} />
                <Route path="prices" element={<PriceManagement />} />
                <Route path="users" element={<UserManagement />} />
              </Route>
              <Route path="/auth" element={<AuthView />} />
              <Route
                path="/confirm-appointment/:confirmationToken"
                element={<AppointmentConfirmation />}
              />
              <Route path="/location" element={<LocationView />} />
              <Route path="/" element={<HomeView />} />
              <Route path="/profile" element={<ProfileView />} />
              <Route path="/reset-password" element={<ResetPasswordView />} />
              <Route
                path="/reset-password/:resetToken"
                element={<NewPasswordView />}
              />
              <Route path="*" element={<div>nonono</div>} />
            </Routes>
          </LocalizationProvider>
          </PricesProvider>
        </AuthContext.Provider>
      </BrowserRouter>
    </AlertProvider>
  );
}

export default App;
