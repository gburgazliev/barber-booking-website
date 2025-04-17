import React from 'react';

const BarberPole = ({ className = '', height = 200, width = 30 }) => {
  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <div className="absolute inset-0 rounded-full overflow-hidden bg-gray-300">
        <div className="barber-pole absolute inset-0"></div>
      </div>
      <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-yellow-600"></div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-8 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-yellow-600"></div>
        </div>
      </div>
    </div>
  );
};

export default BarberPole;