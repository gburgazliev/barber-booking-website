import { GoogleMap, LoadScript, MarkerF } from '@react-google-maps/api';
import picture from '../assets/image.png'
const Location = () => {
  const center = {
    lat: 43.224559,
    lng: 27.925676
  };

  const mapContainerStyle = {
    width: "100%",
    height: "400px"
  };

  return (
    <div className="flex flex-col md:flex-row md:w-4/5 max-w-full gap-5 p-5 border-2 bg-black items-center justify-center">
      <div className='border-2 w-full'>
        <LoadScript googleMapsApiKey="AIzaSyDZY1JO5MSS-bdztzPTDybpYhIBo4OtCeI">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={15}
        >
          <MarkerF 
            position={center}
            title="Store Location"
          />
        </GoogleMap>
      </LoadScript>
      </div>
      

      <div className=''>
        <img src={picture} alt="" className="max-w-full md:h-96 border-2" />
      </div>
    </div>
  );
};

export default Location;