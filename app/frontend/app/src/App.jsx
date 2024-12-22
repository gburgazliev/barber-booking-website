import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { useState } from "react";
import HomeView from "./views/HomeView";
import AuthContext from "./context/AuthContext";
import Authentication from "./hoc/Authentication";
import AuthView from "./views/AuthView";
import AlertProvider from "./hoc/AlertProvider";
import AlertContainer from "./components/AlertContainer";
import ResetPasswordView from './views/ResetPasswordView';
import NewPasswordView from "./views/NewPasswordView";


function App() {
  const [authValue, setAuthValue] = useState({ status: false, user: {} });

  return (
    <AlertProvider>
      <AlertContainer />
      <BrowserRouter>
        <AuthContext.Provider
          value={{ isLoggedIn: authValue, setIsLoggedIn: setAuthValue }}
        >
          <Routes>
            <Route path="/auth" element={<AuthView />} />
            <Route path="/" element={<HomeView />} />
            <Route path="/reset-password" element={<ResetPasswordView />} />
            <Route path="/reset-password/:resetToken" element={<NewPasswordView />} />
          </Routes>
        </AuthContext.Provider>
      </BrowserRouter>
    </AlertProvider>
  );
}

export default App;
