/**
 * Utility functions for managing appointment slots
 */

/**
 * Calculate a time slot with a specified offset in minutes
 * @param {string} timeSlot - Time slot in format "HH:MM"
 * @param {number} offsetMinutes - Minutes to add (positive) or subtract (negative)
 * @returns {string} New time slot in format "HH:MM"
 */
const calculateTimeWithOffset = (timeSlot, offsetMinutes) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes + offsetMinutes;
    
    // Ensure we don't go negative
    if (totalMinutes < 0) totalMinutes = 0;
    
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  };
  
  /**
   * Calculate the next regular time slot (40 minutes later)
   * @param {string} timeSlot - Time slot in format "HH:MM"
   * @returns {string} Time slot 40 minutes later
   */
  const calculateNextTimeSlot = (timeSlot) => {
    return calculateTimeWithOffset(timeSlot, 40);
  };
  
  /**
   * Calculate intermediate time slot (30 minutes after start)
   * @param {string} timeSlot - Start time slot in format "HH:MM"
   * @returns {string} Time slot 30 minutes later
   */
  const calculateIntermediateSlot = (timeSlot) => {
    return calculateTimeWithOffset(timeSlot, 30);
  };
  
  /**
   * Calculate shifted time slot (regular slot + 10 minutes)
   * @param {string} timeSlot - Regular time slot in format "HH:MM"
   * @returns {string} Time slot shifted by 10 minutes
   */
  const calculateShiftedSlot = (timeSlot) => {
    return calculateTimeWithOffset(timeSlot, 10);
  };
  
  /**
   * Check if a time slot is within working hours and not in break time
   * @param {string} timeSlot - Time to check in format "HH:MM"
   * @param {string} startTime - Working hours start in format "HH:MM"
   * @param {string} endTime - Working hours end in format "HH:MM"
   * @param {string} breakStart - Break start in format "HH:MM"
   * @param {string} breakEnd - Break end in format "HH:MM"
   * @returns {boolean} True if time is within working hours and not in break
   */
  const isWithinWorkingHours = (timeSlot, startTime, endTime, breakStart, breakEnd) => {
    const [h, m] = timeSlot.split(':').map(Number);
    const slotMinutes = h * 60 + m;
    
    const [startH, startM] = startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    
    const [endH, endM] = endTime.split(':').map(Number);
    const endMinutes = endH * 60 + endM;
    
    const [breakStartH, breakStartM] = breakStart.split(':').map(Number);
    const breakStartMinutes = breakStartH * 60 + breakStartM;
    
    const [breakEndH, breakEndM] = breakEnd.split(':').map(Number);
    const breakEndMinutes = breakEndH * 60 + breakEndM;
    
    return (
      slotMinutes >= startMinutes && 
      slotMinutes < endMinutes && 
      !(slotMinutes >= breakStartMinutes && slotMinutes < breakEndMinutes)
    );
  };
  
  /**
   * Check if a time slot is a regular slot (ends with :00 or :40)
   * @param {string} timeSlot - Time slot to check in format "HH:MM"
   * @returns {boolean} True if it's a regular slot
   */
  const isRegularSlot = (timeSlot) => {
    const minutes = timeSlot.split(':')[1];
    return minutes === '00' || minutes === '40';
  };
  
  /**
   * Get minutes since midnight for a time string
   * @param {string} timeString - Time in format "HH:MM"
   * @returns {number} Minutes since midnight
   */
  const getMinutesSinceMidnight = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  /**
   * Check if timeA is after timeB
   * @param {string} timeA - First time in format "HH:MM"
   * @param {string} timeB - Second time in format "HH:MM"
   * @returns {boolean} True if timeA is after timeB
   */
  const isTimeAfter = (timeA, timeB) => {
    return getMinutesSinceMidnight(timeA) > getMinutesSinceMidnight(timeB);
  };
  
  /**
   * Get minutes between two time strings
   * @param {string} startTime - Start time in format "HH:MM"
   * @param {string} endTime - End time in format "HH:MM"
   * @returns {number} Minutes between the times
   */
  const getMinutesBetween = (startTime, endTime) => {
    return getMinutesSinceMidnight(endTime) - getMinutesSinceMidnight(startTime);
  };
  
  /**
   * Generate all available time slots for a day based on working hours
   * @param {string} startTime - Working day start time (HH:MM)
   * @param {string} endTime - Working day end time (HH:MM)
   * @param {string} breakStart - Break start time (HH:MM)
   * @param {string} breakEnd - Break end time (HH:MM)
   * @param {number} slotDuration - Duration of each slot in minutes (default: 40)
   * @returns {string[]} Array of time slots in format "HH:MM"
   */
  const generateTimeSlots = (startTime, endTime, breakStart, breakEnd, slotDuration = 40) => {
    const slots = [];
    const breakStartDate = new Date(`1970-01-01T${breakStart}:00`);
    const breakEndDate = new Date(`1970-01-01T${breakEnd}:00`);
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
  
    while (start <= end) {
      if (start >= breakStartDate && start < breakEndDate) {
        start.setMinutes(start.getMinutes() + slotDuration);
        continue;
      }
      slots.push(start.toTimeString().substring(0, 5));
      start.setMinutes(start.getMinutes() + slotDuration);
    }
  
    return slots;
  };
  
  module.exports = {
    calculateTimeWithOffset,
    calculateNextTimeSlot,
    calculateIntermediateSlot,
    calculateShiftedSlot,
    isWithinWorkingHours,
    isRegularSlot,
    getMinutesSinceMidnight,
    isTimeAfter,
    getMinutesBetween,
    generateTimeSlots
  };