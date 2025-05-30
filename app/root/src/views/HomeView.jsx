import Header from "../components/Header";
import Home from "../components/Home";

const HomeView = () => {
  


  return (
    <div className="md:flex-col justify-items-center md:items-center w-screen overflow-x-hidden md:flex md:gap-10">
      

      <Header />
      <Home />
    </div>
  );
};

export default HomeView;