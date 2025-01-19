import { GoogleMap, LoadScript, MarkerF } from "@react-google-maps/api";
import picture from "../assets/image.png";
const Location = () => {
  const center = {
    lat: 43.224559,
    lng: 27.925676,
  };

  const mapContainerStyle = {
    width: "100%",
    height: "400px",
  };

  return (
    <div className="flex flex-col lg:flex-row md:w-4/5 max-w-full gap-5 p-5 border-2 bg-black items-center justify-center">
      <div className=" w-full lg:w-1/2">
        <LoadScript googleMapsApiKey="AIzaSyDZY1JO5MSS-bdztzPTDybpYhIBo4OtCeI"  loadingElement={<span className="loading loading-spinner loading-md"></span>}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={15}
          >
            <MarkerF position={center} title="Store Location" />
          </GoogleMap>
        </LoadScript>
      </div>

      
        <img src={picture} alt="" className="max-w-full md:h-96 border-2" />
      
    </div>
  );
};

export default Location;
