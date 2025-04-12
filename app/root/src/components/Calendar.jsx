import { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";
import AlertContext from "../context/AlertContext";
import Appointment from "./Appointment";
import AlERT_TYPES from "../constants/alertTypeConstants";
import { SERVER_URL } from "../constants/serverUrl";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { StaticDateTimePicker } from "@mui/x-date-pickers/StaticDateTimePicker";
import { Typography } from "@mui/material";
import Divider from "@mui/material/Divider";
import {
  fetchCustomSlotPatterns,
  isRegularSlot,
  isTimeAfter,
  generateIntermediateSlot,
  getMinutesSinceMidnight,
  getMinutesBetween,
} from "../service/calendar-service";
import dayjs from "dayjs";

const Calendar = () => {
  const [date, setDate] = useState(dayjs());
  const [startTime, setStartTime] = useState(
    dayjs().hour(9).minute(0).second(0)
  );
  const [selectedDateTime, setSelectedDateTime] = useState(dayjs());
  const [isStartHourChanged, setIsStartHourChanged] = useState(false);
  const [isStartMinutesChanged, setIsStartMinutesChanged] = useState(false);
  const [isEndTimeChanged, setIsEndTimeChanged] = useState(false);
  const [endTime, setEndTime] = useState(dayjs().hour(19).minute(0).second(0));
  const [currentUserAppointments, setCurrentUserAppointments] = useState({});
  const [timeSlots, setTimeSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [shiftedSlots, setShiftedSlots] = useState([]);
  const [intermediateSlots, setIntermediateSlots] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const { addAlert } = useContext(AlertContext);
  const { isLoggedIn } = useContext(AuthContext);
  const minDate = dayjs();

  // Set maximum date to 14 days from today
  const maxDate = dayjs().add(14, "day");

  const formattedDateString = date.toISOString().split("T")[0]; // YYYY-MM-DD

  const getSlotType = (timeSlot) => {
    // Check if it's a shifted slot
    const isShifted = shiftedSlots.some(
      (slot) => slot.shiftedTime === timeSlot
    );

    // Check if it's an intermediate slot
    const isIntermediate = intermediateSlots.some(
      (slot) => slot.slotTime === timeSlot
    );

    // Check if it's a regular 40-minute slot
    const isRegular = isRegularSlot(timeSlot);

    if (isShifted)
      return { isShiftedSlot: true, isIntermediateSlot: false, duration: 30 };
    if (isIntermediate)
      return { isShiftedSlot: false, isIntermediateSlot: true, duration: 30 };
    if (!isRegular)
      return { isShiftedSlot: false, isIntermediateSlot: false, duration: 30 }; // 30-minute slot

    return { isShiftedSlot: false, isIntermediateSlot: false, duration: 40 }; // Regular 40-minute slot
  };

  // Helper function to calculate the next time slot (40 minutes later)
  const calculateNextTimeSlot = (timeSlot) => {
    const [hours, minutes] = timeSlot.split(":").map(Number);
    let newMinutes = minutes + 40;
    let newMinutesTwo = minutes + 30;
    let newHoursOne = hours;
    let newHoursTwo = hours;

    if (newMinutes >= 60) {
      newMinutes -= 60;
      newHoursOne += 1;
    }
    if (newMinutesTwo >= 60) {
      newMinutesTwo -= 60;
      newHoursTwo += 1;
    }

    return [
      `${String(newHoursOne).padStart(2, "0")}:${String(newMinutes).padStart(
        2,
        "0"
      )}`,
      `${String(newHoursTwo).padStart(2, "0")}:${String(newMinutesTwo).padStart(
        2,
        "0"
      )}`,
    ];
  };

  const handleTimeChange = (dateObject) => {
    if (dateObject.$D !== date.$D) {
      setDate(dateObject);
      return; // so appointments and schedule are only fetched when the day is changed and not the time
    }
    const dateObj = new Date(dateObject.$d);
    const hours = dateObj.getHours().toString();
    if (!isStartHourChanged || !isStartMinutesChanged) {
      const formatStartTime = dayjs().hour(hours).minute(dateObj.getMinutes());
      setStartTime(formatStartTime);

      if (isStartHourChanged && !isStartMinutesChanged) {
        setIsStartMinutesChanged(true);
      }
      setIsStartHourChanged(true);
    }

    if (!isStartMinutesChanged || !isStartHourChanged) return;

    if (!isEndTimeChanged) {
      const formatStartTime = dayjs().hour(hours).minute(dateObj.getMinutes());
      setEndTime(formatStartTime);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      let start = new Date(startTime.$d).toTimeString().split(" ")[0];
      start = start.slice(0, start.length - 3);
      let end = new Date(endTime.$d).toTimeString().split(" ")[0];
      end = end.slice(0, end.length - 3);
      if (appointments.length) {
        throw new Error("Appointments already made for this schedule");
      }

      const response = await fetch(
        SERVER_URL("api/schedule/set-working-hours"),
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: formattedDateString,
            startTime: start,
            endTime: end,
            // breakStart,
            // breakEnd,
          }),
        }
      );
      const data = await response.json();
      addAlert(
        "Schedule updated !",
        AlERT_TYPES.SUCCESS,
        undefined,
        undefined,
        false,
        false
      );
      generateTimeSlots(
        data.startTime,
        data.endTime,
        data.breakStart,
        data.breakEnd
      );
    } catch (error) {
      addAlert(
        `Error updating schedule: ${error.message}`,
        undefined,
        undefined,
        true,
        false,
        false,
        3000
      );
    }
  };

  const generateTimeSlots = (startTime, endTime, startBreak, endBreak) => {
    const slots = [];
    const breakStart = new Date(`1970-01-01T${startBreak}:00`);
    const breakEnd = new Date(`1970-01-01T${endBreak}:00`);
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);

    while (start <= end) {
      if (start >= breakStart && start < breakEnd) {
        start.setMinutes(start.getMinutes() + 40);
        continue;
      }
      slots.push(start.toTimeString().substring(0, 5));
      start.setMinutes(start.getMinutes() + 40);
    }

    setTimeSlots(slots);
  };

  // Process appointments and custom slot patterns to generate available time slots
  const processAppointmentsAndSlots = async (baseSlots) => {
    if (!appointments.length) {
      return baseSlots;
    }

    // Create a copy of base slots
    let availableSlots = [...baseSlots];

    // Process Hair and Beard appointments first
    const hairAndBeardAppointments = appointments.filter(
      (appt) => appt.type === "Hair and Beard" && appt.status === "Confirmed"
    );

    // For each Hair and Beard appointment, remove both its slot and the next one
    hairAndBeardAppointments.forEach((appt) => {
      const currentSlot = appt.timeSlot;
      const nextSlot = calculateNextTimeSlot(currentSlot);

      // Remove both slots

      availableSlots = availableSlots.filter(
        (slot) => slot !== currentSlot && slot !== nextSlot
      );
    });

    // Now handle other appointment types by removing their slots
    const otherAppointments = appointments.filter(
      (appt) => appt.type !== "Hair and Beard" && appt.status === "Confirmed"
    );

    otherAppointments.forEach((appt) => {
      availableSlots = availableSlots.filter((slot) => slot !== appt.timeSlot);
    });

    // Get custom slot patterns if any exist
    const customPatterns = await fetchCustomSlotPatterns(
      SERVER_URL,
      formattedDateString
    );

    if (customPatterns && customPatterns.hasCustomPattern) {
      // Collect all slots to add (shifted/intermediate)
      const slotsToAdd = [];

      // Add shifted slots that aren't booked
      customPatterns.shiftedSlots.forEach((slot) => {
        if (!slot.isBooked) {
          slotsToAdd.push(slot.shiftedTime);
        }
      });

      // Add intermediate slots that aren't booked
      customPatterns.intermediateSlots.forEach((slot) => {
        if (!slot.isBooked) {
          slotsToAdd.push(slot.slotTime);
        }
      });

      // Add new slots
      slotsToAdd.forEach((slot) => {
        if (!availableSlots.includes(slot)) {
          availableSlots.push(slot);
        }
      });
    }
    if (blockedSlots.length) {
      blockedSlots.forEach((slotOBJ) => {
        availableSlots.map((slot, index) => {
          if (slotOBJ.timeSlot === slot) {
            availableSlots.splice(index, 1);
          }
        });
      });
    }

    // Sort slots chronologically
    availableSlots.sort(
      (a, b) => getMinutesSinceMidnight(a) - getMinutesSinceMidnight(b)
    );

    return availableSlots;
  };

  // Fix the generateTimeSlots function to ensure correct 40-minute intervals
  // const generateTimeSlots = (startTime, endTime, breakStart, breakEnd) => {
  //   const slots = [];
  //   const breakStartDate = new Date(`1970-01-01T${breakStart}:00`);
  //   const breakEndDate = new Date(`1970-01-01T${breakEnd}:00`);

  //   // Create a new date object to avoid modifying the original
  //   let current = new Date(`1970-01-01T${startTime}:00`);
  //   const end = new Date(`1970-01-01T${endTime}:00`);

  //   // Generate slots at exact 40-minute intervals
  //   while (current <= end) {
  //     // Skip slots during break time
  //     if (current >= breakStartDate && current < breakEndDate) {
  //       current.setMinutes(current.getMinutes() + 40);
  //       continue;
  //     }

  //     slots.push(current.toTimeString().substring(0, 5));
  //     current.setMinutes(current.getMinutes() + 40);
  //   }

  //   return slots;
  // };
  // Combined function to fetch schedule and appointments
  const refreshData = async () => {
    try {
      // Fetch schedule
      const scheduleResponse = await fetch(
        SERVER_URL(`api/schedule/get-working-hours/:${formattedDateString}`)
      );

      let baseSlots = [];
      if (scheduleResponse.ok) {
        const scheduleData = await scheduleResponse.json();
        setBlockedSlots(scheduleData.blockedSlots);
        setIntermediateSlots(scheduleData.intermediateSlots);
        setShiftedSlots(scheduleData.shiftedSlots);
        console.log(scheduleData);
        const startTimeArr = scheduleData.startTime.split(":");
        const endTimeArr = scheduleData.endTime.split(":");
        setStartTime((prev) =>
          prev.hour(Number(startTimeArr[0])).minute(Number(startTimeArr[1]))
        );
        setEndTime((prev) =>
          prev.hour(Number(endTimeArr[0])).minute(Number(endTimeArr[1]))
        );

        // Generate base slots
        const slots = [];
        const breakStart = new Date(`1970-01-01T${scheduleData.breakStart}:00`);
        const breakEnd = new Date(`1970-01-01T${scheduleData.breakEnd}:00`);
        const start = new Date(`1970-01-01T${scheduleData.startTime}:00`);
        const end = new Date(`1970-01-01T${scheduleData.endTime}:00`);

        // Ensure we generate slots at exactly 40-minute intervals
        let slotTime = new Date(start);
        while (slotTime <= end) {
          if (slotTime >= breakStart && slotTime < breakEnd) {
            slotTime.setMinutes(slotTime.getMinutes() + 40);
            continue;
          }
          slots.push(slotTime.toTimeString().substring(0, 5));
          slotTime.setMinutes(slotTime.getMinutes() + 40);
        }

        baseSlots = slots;
      } else {
        // Default schedule if none exists
        setStartTime((prev) => prev.hour(9).minute(0));
        setEndTime((prev) => prev.hour(19).minute(0));

        // Generate default base slots
        const slots = [];
        let start = new Date(`1970-01-01T09:00:00`);
        const end = new Date(`1970-01-01T18:20:00`);
        const breakStart = new Date(`1970-01-01T13:00:00`);
        const breakEnd = new Date(`1970-01-01T14:00:00`);

        // Ensure we generate slots at exactly 40-minute intervals
        while (start <= end) {
          if (start >= breakStart && start < breakEnd) {
            start.setMinutes(start.getMinutes() + 40);
            continue;
          }
          slots.push(start.toTimeString().substring(0, 5));
          start.setMinutes(start.getMinutes() + 40);
        }

        baseSlots = slots;
      }

      // Fetch appointments
      const appointmentsResponse = await fetch(
        SERVER_URL(`api/appointments/:${formattedDateString}`)
      );

      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        console.log(appointmentsData);
        setAppointments(appointmentsData.appointments);
        // setBlockedSlots(appointmentsData.blockedSlots);

        // Check if there are any Hair and Beard appointments
        const hairAndBeardAppointments = appointmentsData.appointments.filter(
          (appt) => appt.type === "Hair and Beard"
        );

        // Only modify slots if there are Hair and Beard appointments or custom slot patterns
        if (
          hairAndBeardAppointments.length > 0 ||
          appointmentsData.shiftedSlots.length > 0 ||
          appointmentsData.intermediateSlots.length > 0
        ) {
          // Process appointments and custom slots
          const availableSlots = await processAppointmentsAndSlots(baseSlots);

          setTimeSlots(availableSlots);
        } else {
          // If no Hair and Beard appointments, just filter out booked slots
          const availableSlots = baseSlots.filter(
            (slot) =>
              !appointmentsData.appointments.some(
                (appt) => appt.timeSlot === slot
              )
          );
          setTimeSlots(availableSlots);
        }
      } else {
        // If no appointments, just use the base slots
        setTimeSlots(baseSlots);
      }
    } catch (error) {
      console.error("Failed fetching data:", error.message);
      addAlert(`Error refreshing data: ${error.message}`);
    }
  };



  // Initial data fetch when date changes
  useEffect(() => {
    refreshData();
  }, [formattedDateString]);

  
  // Filter out booked slots and slots after Hair and Beard appointments
  useEffect(() => {
    const updateAvailableSlots = async () => {
      if (appointments.length > 0) {
        const scheduleResponse = await fetch(
          SERVER_URL(`api/schedule/get-working-hours/:${formattedDateString}`)
        );

        let baseSlots = [];

        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json();

          // Generate base slots
          const slots = [];
          const breakStart = new Date(
            `1970-01-01T${scheduleData.breakStart}:00`
          );
          const breakEnd = new Date(`1970-01-01T${scheduleData.breakEnd}:00`);
          const start = new Date(`1970-01-01T${scheduleData.startTime}:00`);
          const end = new Date(`1970-01-01T${scheduleData.endTime}:00`);

          while (start <= end) {
            if (start >= breakStart && start < breakEnd) {
              start.setMinutes(start.getMinutes() + 40);
              continue;
            }
            slots.push(start.toTimeString().substring(0, 5));
            start.setMinutes(start.getMinutes() + 40);
          }

          baseSlots = slots;
        } else {
          // Default base slots
          const slots = [];
          const start = new Date(`1970-01-01T09:00:00`);
          const end = new Date(`1970-01-01T19:00:00`);
          const breakStart = new Date(`1970-01-01T13:00:00`);
          const breakEnd = new Date(`1970-01-01T14:00:00`);

          while (start <= end) {
            if (start >= breakStart && start < breakEnd) {
              start.setMinutes(start.getMinutes() + 40);
              continue;
            }
            slots.push(start.toTimeString().substring(0, 5));
            start.setMinutes(start.getMinutes() + 40);
          }

          baseSlots = slots;
        }

        // Process appointments and custom slots
        const availableSlots = await processAppointmentsAndSlots(baseSlots);
        setTimeSlots(availableSlots);
      }
    };

    updateAvailableSlots();
  }, [appointments, formattedDateString]);

  // useEffect(() => {
  //   if (appointments.length > 0) {
  //     setTimeSlots((prev) =>
  //       prev.filter((timeSlot) => {
  //         const isBookedByOthers = appointments.some(
  //           (appointment) => timeSlot === appointment.timeSlot
  //         );

  //         // If it's booked by someone else, filter it out
  //         if (isBookedByOthers) {
  //           return false;
  //         } else {
  //           return true;
  //         }

  //         // Otherwise keep the time slot (whether it's available or booked by current user)
  //       })
  //     );
  //   }
  // }, [appointments, isLoggedIn]);

  return (
    <div className="border bg-white">
      {isLoggedIn.user.role !== "admin" ? (
        <DateCalendar
          value={date}
          onChange={(newDate) => setDate(newDate)}
          minDate={minDate}
          maxDate={maxDate}
          openTo="day"
          views={["day"]}
        />
      ) : (
        <>
          <StaticDateTimePicker
            value={selectedDateTime}
            onChange={handleTimeChange}
            ampm={false}
            views={["year", "day", "hours", "minutes"]}
            onAccept={handleSaveSchedule}
          />
          <Typography>
            Selected Schedule: {startTime.format("h:mm A")} -{" "}
            {endTime.format("h:mm A")}
          </Typography>{" "}
        </>
      )}
      <Divider textAlign="center">
        {" "}
        Available appointments for {formattedDateString}
      </Divider>
      <div className="grid grid-cols-4 gap-5 p-5 ml-2 mr-2 ">
        {timeSlots.map((timeSlot, index) => (
          <Appointment
            key={index}
            timeSlot={timeSlot}
            date={formattedDateString}
            appointments={appointments}
            setCurrentUserAppointments={setCurrentUserAppointments}
            refreshAppointments={refreshData}
            timeSlots={timeSlots}
            calculateNextTimeSlot={calculateNextTimeSlot}
            slotDuration={getSlotType(timeSlot).duration}
            isRegularSlot={isRegularSlot(timeSlot)}
            isShiftedSlot={getSlotType(timeSlot).isShiftedSlot}
            isIntermediateSlot={getSlotType(timeSlot).isIntermediateSlot }
          />
        ))}
      </div>
      {isLoggedIn.status && (
        <div className="flex flex-col">
          <Divider textAlign="left">Your appointments </Divider>
          <div className="m-2 p-2">
            {appointments
              .filter(
                (appointment) => appointment.userId._id === isLoggedIn.user._id
              )
              .map((appointmentObj) => {
                // Get slot type information for user appointment
                const slotTypeInfo = getSlotType(appointmentObj.timeSlot);

                return (
                  <Appointment
                    key={appointmentObj._id}
                    timeSlot={appointmentObj.timeSlot}
                    date={formattedDateString}
                    appointments={appointments}
                    setCurrentUserAppointments={setCurrentUserAppointments}
                    refreshAppointments={refreshData}
                    timeSlots={timeSlots}
                    calculateNextTimeSlot={calculateNextTimeSlot}
                    isRegularSlot={slotTypeInfo.duration === 40}
                    slotDuration={slotTypeInfo.duration}
                    isShiftedSlot={slotTypeInfo.isShiftedSlot}
                    isIntermediateSlot={slotTypeInfo.isIntermediateSlot}
                    userAppointment={true}
                  />
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
