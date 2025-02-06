import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";
import AlertContext from "../context/AlertContext";
import Appointment from "./Appointment";
import AlERT_TYPES from '../constants/alertTypeConstants'
import { SERVER_URL } from "../constants/serverUrl";
const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const currentDate = new Date();
  const [timeSlots, setTimeSlots] = useState([]);
  const {addAlert} = useContext(AlertContext);

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
    const response = await fetch(SERVER_URL("api/schedule/set-working-hours"), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: formattedDateString,
        startTime,
        endTime,
      }),
    });
    const data = await response.json();
    addAlert('Schedule updated !', AlERT_TYPES.SUCCESS, )
    generateTimeSlots(data.startTime, data.endTime);
    } catch (error) {
      addAlert(`Error updating schedule: ${error.message}`)
    }
    
  };

  const generateTimeSlots = (startTime, endTime) => {
    const slots = [];
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    while (start < end) {
      slots.push(start.toTimeString().substring(0, 5));
      start.setMinutes(start.getMinutes() + 30);
    }

    setTimeSlots(slots);
   
  };
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch(
          SERVER_URL(`api/schedule/get-working-hours/:${formattedDateString}`)
        );
        if (!response.ok) {
          setTimeSlots([]);
          return;
        }
        const data = await response.json();

        generateTimeSlots(data.startTime, data.endTime);
      } catch (error) {
        console.error("Failed fetching appointments:", error.message);
      }
    };
    fetchAppointments();
  }, [selectedDate, formattedDateString]);

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
                <h3 className="font-bold text-lg">Hello!</h3>
                <div className="flex gap-2 p-2">
                  <input type="time" id="start" className="" />
                  -
                  <input type="time" id="end" className="" />
                  <button onClick={handleSaveSchedule}>Save</button>
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
            <Appointment key={index} timeSlot={timeSlot} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
