import Header from "../components/Header";
import Location from "../components/Location";

const LocationView = () => {
 return <div className="flex flex-col h-screen w-full relative">
    <div className="sticky top-2 z-10">
        <Header />
    </div>
    <div className="flex flex-grow items-center justify-center">
         <Location />
    </div>
   
  </div>;
};

export default LocationView;
