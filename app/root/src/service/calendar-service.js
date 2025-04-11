export const getMinutesSinceMidnight = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Calculate minutes between two time strings
  export const getMinutesBetween = (time1, time2) => {
    return Math.abs(getMinutesSinceMidnight(time2) - getMinutesSinceMidnight(time1));
  };
  
  // Add minutes to a time string
  export const addMinutes = (timeStr, minutes) => {
    let [hours, mins] = timeStr.split(':').map(Number);
    mins += minutes;
    hours += Math.floor(mins / 60);
    mins = mins % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };
  
  // Check if a slot follows the regular 40-minute pattern
  export const isRegularSlot = (timeStr) => {
    const minutes = parseInt(timeStr.split(':')[1]);
    console.log(timeStr, minutes)
    // minutes % 40 === 0;
     const regularMinutes = new Set([0, 40, 20]); // All possible minutes for regular slots
  return regularMinutes.has(minutes);
     
  };
  
  // Generate a 30-minute slot between two times if there's enough space
  export const generateIntermediateSlot = (startSlot, endSlot) => {
    const gap = getMinutesBetween(startSlot, endSlot);
    if (gap >= 60) { // Need at least 60 minutes to fit a 30-minute slot with 15-minute buffers
      const startMins = getMinutesSinceMidnight(startSlot);
      const endMins = getMinutesSinceMidnight(endSlot);
      
      // Create a slot in the middle, starting 15 minutes after the first slot ends
      const slotStart = startMins + 40 + 15; // 40 mins for first slot + 15 min buffer
      const hours = Math.floor(slotStart / 60);
      const minutes = slotStart % 60;
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    return null;
  };

  export const fetchCustomSlotPatterns = async (url, formattedDateString) => {
    try {
      const response = await fetch(
        url(`api/schedule/custom-slots/:${formattedDateString}`)
      );
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return { hasCustomPattern: false };
    } catch (error) {
      console.error("Error fetching custom slot patterns:", error);
      return { hasCustomPattern: false };
    }
  };

export const isTimeAfter = (time1, time2) => {
    return getMinutesSinceMidnight(time1) > getMinutesSinceMidnight(time2);
  };

 