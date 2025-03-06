import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";
import AlertContext from "../context/AlertContext";
import Appointment from "./Appointment";
import AlERT_TYPES from "../constants/alertTypeConstants";
import { SERVER_URL } from "../constants/serverUrl";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs from "dayjs";

const Calendar = () => {
  const [date, setDate] = useState(dayjs());
  const [currentUserAppointments, setCurrentUserAppointments] = useState({});
  const [timeSlots, setTimeSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const { addAlert } = useContext(AlertContext);
  const { isLoggedIn } = useContext(AuthContext);
  const minDate = dayjs();

  // Set maximum date to 14 days from today
  const maxDate = dayjs().add(14, "day");

  const formattedDateString = date.toISOString().split("T")[0]; // YYYY-MM-DD

  const getDayOfWeek = (date) => {
    return new Date(date).toLocaleDateString("en-US", { weekday: "long" });
  };

  const handleSaveSchedule = async () => {
    try {
      const startTime = document.getElementById("start").value;
      const endTime = document.getElementById("end").value;
      const breakStart = document.getElementById("breakStart").value;
      const breakEnd = document.getElementById("breakEnd").value;

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
            startTime,
            endTime,
            breakStart,
            breakEnd,
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
      addAlert(`Error updating schedule: ${error.message}`);
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
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch(
          SERVER_URL(`api/schedule/get-working-hours/:${formattedDateString}`)
        );
        if (!response.ok) {
          generateTimeSlots("09:00", "19:30");
        } else {
          const data = await response.json();

          generateTimeSlots(
            data.startTime,
            data.endTime,
            data.breakStart,
            data.breakEnd
          );
        }
      } catch (error) {
        console.error("Failed fetching appointments:", error.message);
      }
    };

    fetchSchedule();
  }, [formattedDateString]);

 

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch(
          SERVER_URL(`api/appointments/:${formattedDateString}`)
        );
        if (response.ok) {
          const data = await response.json();
          setAppointments(data);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchAppointments();
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

  // Prevent month changes
  const handleMonthChange = () => {
    // Return current month to prevent navigation
    return dayjs().startOf("month");
  };

  return (
    <div className="border bg-white">
      <DateCalendar
        value={date}
        onChange={(newDate) => setDate(newDate)}
        minDate={minDate}
        maxDate={maxDate}
        // onMonthChange={handleMonthChange}
        views={["day"]} // Only show day view, hide year and month pickers
      />
      Available appointments
      <div className="grid grid-cols-4 gap-5">
        {timeSlots.map((timeSlot, index) => (
          <Appointment
            key={index}
            timeSlot={timeSlot}
            date={formattedDateString}
            appointments={appointments}
            setCurrentUserAppointments={setCurrentUserAppointments}
          />
        ))}
      </div>
      <div className="flex flex-col">
        Your appointments
        <div>
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
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
