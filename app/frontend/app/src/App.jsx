import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { useState } from "react";
import HomeView from "./views/HomeView";
import AuthContext from "./context/AuthContext";
import  Authentication  from "./hoc/Authentication";
import AuthView from "./views/AuthView";

function App() {
  const [authValue, setAuthValue] = useState({status: false, user:{}});

  return (
    <BrowserRouter>
      <AuthContext.Provider value={{isLoggedIn: authValue,  setIsLoggedIn: setAuthValue }}>
        <Routes>
          <Route path="/auth" element={<AuthView/>}/>
          <Route path="/" element={<Authentication><HomeView /> </Authentication>} />
        </Routes>
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

export default App;
