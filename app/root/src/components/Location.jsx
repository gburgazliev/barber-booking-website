import { GoogleMap, LoadScript, MarkerF, InfoWindow } from "@react-google-maps/api";
import { useState, useCallback } from "react";
import { LocationIcon, ClockIcon, EmailIcon } from "./BarberIcons";
import { FaPhone, FaDirections, FaParking, FaWifi, FaAccessibleIcon } from "react-icons/fa";
import picture from "../assets/image.png";

const Location = () => {
  const [showInfo, setShowInfo] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const center = {
    lat: 43.224559,
    lng: 27.925676,
  };

  const mapContainerStyle = {
    width: "100%",
    height: "400px",
  };

  // Map options for better UX
  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: true,
    mapTypeControl: false,
    fullscreenControl: true,
    styles: [
      {
        featureType: "poi.business",
        stylers: [{ visibility: "off" }]
      }
    ]
  };

  const onMapLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`;
    window.open(url, '_blank');
  };

  const handleCall = () => {
    window.location.href = "tel:+359898572224";
  };

  const copyAddress = async () => {
    const address = "ul.Studentska, Varna, Bulgaria";
    try {
      await navigator.clipboard.writeText(address);
      // You could add a toast notification here
      alert("Address copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy address: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Visit Our Barbershop</h1>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Located in the heart of Varna, we're easily accessible and ready to provide you with the best grooming experience.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* Map Section */}
          <div className="space-y-4">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-0">
                <div className="h-96 rounded-lg overflow-hidden relative">
                  <LoadScript 
                    googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                    loadingElement={
                      <div className="flex items-center justify-center h-full">
                        <span className="loading loading-spinner loading-lg"></span>
                        <span className="ml-2">Loading map...</span>
                      </div>
                    }
                  >
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={center}
                      zoom={16}
                      options={mapOptions}
                      onLoad={onMapLoad}
                    >
                      <MarkerF 
                        position={center} 
                        title="BARBERIA - Professional Barber Shop"
                        onClick={() => setShowInfo(true)}
                      />
                      
                      {showInfo && (
                        <InfoWindow
                          position={center}
                          onCloseClick={() => setShowInfo(false)}
                        >
                          <div className="p-2">
                            <h3 className="font-bold text-gray-800">BARBERIA</h3>
                            <p className="text-gray-600">Professional Barber Shop</p>
                            <p className="text-sm text-gray-500 mt-1">Click for directions</p>
                          </div>
                        </InfoWindow>
                      )}
                    </GoogleMap>
                  </LoadScript>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleGetDirections}
                className="btn btn-primary btn-block"
              >
                <FaDirections className="mr-2" />
                Get Directions
              </button>
              <button 
                onClick={handleCall}
                className="btn btn-secondary btn-block"
              >
                <FaPhone className="mr-2" />
                Call Us
              </button>
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            {/* Contact Info Card */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-2xl mb-4">
                  <LocationIcon size={24} className="text-primary" />
                  Contact Information
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <LocationIcon size={20} className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Address</p>
                      <p className="text-base-content/70">123 Main Street, Varna 9000, Bulgaria</p>
                      <button 
                        onClick={copyAddress}
                        className="text-xs text-primary hover:underline mt-1"
                      >
                        Copy address
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <FaPhone size={20} className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Phone</p>
                      <a href="tel:+359123456789" className="text-base-content/70 hover:text-primary">
                      +359 898 572 224
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <EmailIcon size={20} className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Email</p>
                      <a href="mailto:barberiavarna@gmail.com" className="text-base-content/70 hover:text-primary">
                       barberiavarna@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Opening Hours Card */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-2xl mb-4">
                  <ClockIcon size={24} className="text-primary" />
                  Opening Hours
                </h2>
                
                <div className="space-y-3">
                  {[
                    { day: "Monday", hours: "9:00 AM - 7:00 PM" },
                    { day: "Tuesday", hours: "9:00 AM - 7:00 PM" },
                    { day: "Wednesday", hours: "9:00 AM - 7:00 PM" },
                    { day: "Thursday", hours: "9:00 AM - 7:00 PM" },
                    { day: "Friday", hours: "9:00 AM - 7:00 PM" },
                    { day: "Saturday", hours: "10:00 AM - 6:00 PM" },
                    { day: "Sunday", hours: "Closed" }
                  ].map((schedule, index) => {
                    const today = new Date().getDay();
                    const isToday = (index + 1) % 7 === today;
                    const isClosed = schedule.hours === "Closed";
                    
                    return (
                      <div 
                        key={schedule.day}
                        className={`flex justify-between items-center p-2 rounded ${
                          isToday ? 'bg-primary/10 border border-primary/20' : ''
                        }`}
                      >
                        <span className={`font-medium ${isToday ? 'text-primary' : ''}`}>
                          {schedule.day}
                          {isToday && <span className="text-xs ml-2 badge badge-primary badge-sm">Today</span>}
                        </span>
                        <span className={`${isClosed ? 'text-error' : isToday ? 'text-primary font-semibold' : 'text-base-content/70'}`}>
                          {schedule.hours}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Amenities Card */}
            {/* <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-2xl mb-4">Amenities</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <FaParking className="text-primary" />
                    <span className="text-sm">Free Parking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaWifi className="text-primary" />
                    <span className="text-sm">Free WiFi</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaAccessibleIcon className="text-primary" />
                    <span className="text-sm">Wheelchair Access</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ClockIcon size={16} className="text-primary" />
                    <span className="text-sm">Walk-ins Welcome</span>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>

        {/* Shop Photo */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4 justify-center">Our Barbershop</h2>
            <div className="flex justify-center">
              <img 
                src={picture} 
                alt="BARBERIA Interior" 
                className="max-w-full h-96 object-cover rounded-lg shadow-lg hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>

        {/* Transportation Info */}
        {/* <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-primary text-primary-content shadow-xl">
            <div className="card-body text-center">
              <h3 className="card-title justify-center mb-2">Public Transport</h3>
              <p className="text-sm">Bus lines 2, 8, 15 - Stop: Central Square (2 min walk)</p>
            </div>
          </div>
          
          <div className="card bg-secondary text-secondary-content shadow-xl">
            <div className="card-body text-center">
              <h3 className="card-title justify-center mb-2">Parking</h3>
              <p className="text-sm">Free street parking available. Paid garage 50m away.</p>
            </div>
          </div>
          
          <div className="card bg-accent text-accent-content shadow-xl">
            <div className="card-body text-center">
              <h3 className="card-title justify-center mb-2">Landmarks</h3>
              <p className="text-sm">Next to City Mall, opposite the Central Post Office</p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Location;