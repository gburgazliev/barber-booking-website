import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";
import AlertContext from "../context/AlertContext";
import Appointment from "./Appointment";
import AlERT_TYPES from "../constants/alertTypeConstants";
import { SERVER_URL } from "../constants/serverUrl";

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const currentDate = new Date();
  const [timeSlots, setTimeSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const { addAlert } = useContext(AlertContext);
  const { isLoggedIn } = useContext(AuthContext);

  const maxDate = new Date();
  maxDate.setDate(currentDate.getDate() + 14);
  const formattedDateString = selectedDate.toISOString().split("T")[0]; // YYYY-MM-DD

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
            (appointment) =>
              timeSlot === appointment.timeSlot &&
              appointment.userId._id !== isLoggedIn?.user._id
          );

          // If it's booked by someone else, filter it out
          if (isBookedByOthers) {
            return false;
          }

          // Otherwise keep the time slot (whether it's available or booked by current user)
          return true;
        })
      );
    }
  }, [appointments, isLoggedIn]);

  return (
    <div className="border">
      <div className="flex flex-col">
        <div className="flex justify-between relative">
          <button
            disabled={selectedDate <= currentDate}
            onClick={() =>
              setSelectedDate(
                new Date(selectedDate.setDate(selectedDate.getDate() - 1))
              )
            }
          >
            Previous day
          </button>
          <div className="flex gap-1">
            <h2 className="text-xl font-bold">
              {selectedDate.toLocaleDateString()} - {getDayOfWeek(selectedDate)}
            </h2>

            <button
              className=""
              onClick={() => document.getElementById("my_modal_1").showModal()}
            >
              icon
            </button>
            <dialog id="my_modal_1" className="modal">
              <div className="modal-box">
                <div className="flex flex-col items-center gap-2 p-2">
                  <div className="flex flex-col gap-2 p-2 ">
                    Schedule
                    <div className="flex gap-2 p-2">
                      <input type="time" id="start" className="" />
                      -
                      <input type="time" id="end" className="" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 p-2 ">
                    Break
                    <div className="flex gap-2 p-2">
                      <input type="time" id="breakStart" className="" />
                      -
                      <input type="time" id="breakEnd" className="" />
                    </div>
                  </div>

                  <button className="w-1/4" onClick={handleSaveSchedule}>
                    Save
                  </button>
                </div>
                <div className="modal-action">
                  <form method="dialog">
                    {/* if there is a button in form, it will close the modal */}
                    <button className="btn">Close</button>
                  </form>
                </div>
              </div>
            </dialog>
          </div>
          <button
            disabled={selectedDate.getDate() == maxDate.getDate()}
            onClick={() =>
              setSelectedDate(
                new Date(selectedDate.setDate(selectedDate.getDate() + 1))
              )
            }
          >
            Next day
          </button>
        </div>
        <div className="grid grid-cols-4 gap-5">
          {timeSlots.map((timeSlot, index) => (
            <Appointment
              key={index}
              timeSlot={timeSlot}
              date={formattedDateString}
              appointments={appointments}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
