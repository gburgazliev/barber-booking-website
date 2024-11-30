import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

function App() {
  const Home = () => (
    <div>
      <h1>Home page</h1>
      <a href="">sadadsd</a>
    </div>
  );


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
