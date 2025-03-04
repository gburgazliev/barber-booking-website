import React from 'react';
import { useTimer } from 'react-timer-hook';

// Countdown Timer Component
const CountdownTimer = ({ expiryTimestamp }) => {
  const {
    seconds,
    minutes,
    isRunning,
    restart,
  } = useTimer({ 
    expiryTimestamp, 
    onExpire: () => console.log('Timer expired')
  });

  return (
    <div className="text-center mt-2">
      <span className="countdown font-mono text-lg">
        <span style={{ "--value": minutes }}></span>m
        <span style={{ "--value": seconds }}></span>s
      </span>
      {isRunning ? (
        <p className="text-xs mt-1 text-red-500">Time remaining to cancel</p>
      ) : (
        <p className="text-xs mt-1 text-gray-500">Cancellation period ended</p>
      )}
    </div>
  );
};

export default CountdownTimer;