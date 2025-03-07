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
  const { addAlert } = useContext(AlertContext);
  const { isLoggedIn } = useContext(AuthContext);
  const minDate = dayjs();

  // Set maximum date to 14 days from today
  const maxDate = dayjs().add(14, "day");

  const formattedDateString = date.toISOString().split("T")[0]; // YYYY-MM-DD

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

    while (start < end) {
      if (start >= breakStart && start < breakEnd) {
        start.setMinutes(start.getMinutes() + 30);
        continue;
      }
      slots.push(start.toTimeString().substring(0, 5));
      start.setMinutes(start.getMinutes() + 30);
    }

    setTimeSlots(slots);
  };

  // Combined function to fetch schedule and appointments
  const refreshData = async () => {
    try {
      // Fetch schedule
      const scheduleResponse = await fetch(
        SERVER_URL(`api/schedule/get-working-hours/:${formattedDateString}`)
      );
      if (scheduleResponse.ok) {
        const scheduleData = await scheduleResponse.json();
        generateTimeSlots(
          scheduleData.startTime,
          scheduleData.endTime,
          scheduleData.breakStart,
          scheduleData.breakEnd
        );
      } else {
        // Default schedule if none exists
        generateTimeSlots("09:00", "19:30");
      }

      // Fetch appointments
      const appointmentsResponse = await fetch(
        SERVER_URL(`api/appointments/:${formattedDateString}`)
      );
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        setAppointments(appointmentsData);
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

  useEffect(() => {
    if (appointments.length > 0) {
      setTimeSlots((prev) =>
        prev.filter((timeSlot) => {
          const isBookedByOthers = appointments.some(
            (appointment) => timeSlot === appointment.timeSlot
          );

          // If it's booked by someone else, filter it out
          if (isBookedByOthers) {
            return false;
          } else {
            return true;
          }

          // Otherwise keep the time slot (whether it's available or booked by current user)
        })
      );
    }
  }, [appointments, isLoggedIn]);

  return (
    <div className="border bg-white">
      {isLoggedIn.user.role !== "admin" ? (
        <DateCalendar
          value={date}
          onChange={(newDate) => setDate(newDate)}
          minDate={isLoggedIn.user.role === "admin" ? undefined : minDate}
          maxDate={isLoggedIn.user.role === "admin" ? undefined : maxDate}
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
      <Divider textAlign="right"> Available appointments </Divider>
      <div className="grid grid-cols-4 gap-5 p-5 ml-2 mr-2 ">
        {timeSlots.map((timeSlot, index) => (
          <Appointment
            key={index}
            timeSlot={timeSlot}
            date={formattedDateString}
            appointments={appointments}
            setCurrentUserAppointments={setCurrentUserAppointments}
            refreshAppointments={refreshData}
          />
        ))}
      </div>
      {isLoggedIn.status && (
        <div className="flex flex-col">
          <Divider textAlign="left">Your appointments </Divider>
          <div className="m-2 p-2">
            {appointments
              .filter(
                (appointment) => appointment._id === currentUserAppointments._id
              )
              .map((appointmentObj) => (
                <Appointment
                  key={appointmentObj._id}
                  timeSlot={appointmentObj.timeSlot}
                  date={formattedDateString}
                  appointments={appointments}
                  setCurrentUserAppointments={setCurrentUserAppointments}
                  refreshAppointments={refreshData}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
