import Header from "../components/Header";
import Home from "../components/Home";
import ThreeJSBackground from "../components/ThreeJSBackground";
import { useState, useEffect } from "react";

const HomeView = () => {
  const [is3dEnabled, setIs3dEnabled] = useState(() => {
    // Check localStorage for saved preference
    const savedPreference = localStorage.getItem('barberia-3d-enabled');
    if (savedPreference !== null) {
      return JSON.parse(savedPreference);
    }
    // Default to true for desktop, false for mobile
    return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  });

  // Handle 3D toggle from any component
  const handle3dToggle = (enabled) => {
    setIs3dEnabled(enabled);
    localStorage.setItem('barberia-3d-enabled', JSON.stringify(enabled));
  };

  // Share the 3D state with other components via window object
  useEffect(() => {
    window.barberiaConfig = {
      ...window.barberiaConfig,
      is3dEnabled,
      toggle3d: handle3dToggle
    };
  }, [is3dEnabled]);

  return (
    <div className="md:flex-col justify-items-center md:items-center w-full relative">
      {/* Add 3D background conditionally */}
      {is3dEnabled && <ThreeJSBackground handleToggle={handle3dToggle} />}
      
      {/* Add manual toggle button in case the one in ThreeJSBackground doesn't show */}
      <button 
        onClick={() => handle3dToggle(!is3dEnabled)}
        className="fixed bottom-4 right-4 z-50 p-2 rounded-full shadow-lg bg-purple-700 text-white"
        style={{
          boxShadow: is3dEnabled ? '0 0 10px 3px rgba(138, 43, 226, 0.7)' : 'none',
          transition: 'box-shadow 0.3s ease'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 2l.66.37 3.78 1.97L12 2l1.56 2.34L17.34 6l-2.34 1.56L17.34 9.12 12 18l-5.34-8.88L4.32 7.56 2 6l1.56-2.34L7.34 2z" />
        </svg>
      </button>
      
      <Header />
      <Home />
    </div>
  );
};

export default HomeView;