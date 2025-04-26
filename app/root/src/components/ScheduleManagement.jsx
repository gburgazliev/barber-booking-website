import React, { useState, useEffect, useContext } from "react";
import { SERVER_URL } from "../constants/serverUrl";
import AlertContext from "../context/AlertContext";
import ALERT_TYPES from "../constants/alertTypeConstants";
import dayjs from "dayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

const ScheduleManagement = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [workingHours, setWorkingHours] = useState({
    startTime: "09:00",
    endTime: "19:00",
    breakStart: "",
    breakEnd: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const { addAlert } = useContext(AlertContext);

  const formattedDate = selectedDate.format("YYYY-MM-DD");

  const fetchWorkingHours = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        SERVER_URL(`api/schedule/get-working-hours/:${formattedDate}`)
      );

      if (response.ok) {
        const data = await response.json();
        setWorkingHours({
          startTime: data.startTime || "09:00",
          endTime: data.endTime || "19:00",
          breakStart: data.breakStart || "",
          breakEnd: data.breakEnd || "",
        });
      } else if (response.status === 400) {
        // No working hours found, use defaults
        setWorkingHours({
          startTime: "09:00",
          endTime: "19:00",
          breakStart: "",
          breakEnd: "",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch working hours");
      }
    } catch (error) {
      addAlert(
        `Error loading working hours: ${error.message}`,
        ALERT_TYPES.ERROR
      );
    } finally {
      setLoading(false);
    }
  };

  // Generate time slots based on working hours
  const generateTimeSlots = () => {
    const slots = [];

    // Parse start and end times
    const [startHour, startMinute] = workingHours.startTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = workingHours.endTime.split(":").map(Number);

    let currentTime = dayjs().hour(startHour).minute(startMinute).second(0);
    const endTime = dayjs().hour(endHour).minute(endMinute).second(0);

    // Parse break times if provided
    let breakStart = null;
    let breakEnd = null;

    if (workingHours.breakStart && workingHours.breakEnd) {
      const [breakStartHour, breakStartMinute] = workingHours.breakStart
        .split(":")
        .map(Number);
      const [breakEndHour, breakEndMinute] = workingHours.breakEnd
        .split(":")
        .map(Number);
      breakStart = dayjs()
        .hour(breakStartHour)
        .minute(breakStartMinute)
        .second(0);
      breakEnd = dayjs().hour(breakEndHour).minute(breakEndMinute).second(0);
    }

    if (workingHours.breakStart && workingHours.breakEnd) {
      const [breakStartHour, breakStartMinute] = workingHours.breakStart
        .split(":")
        .map(Number);
      const [breakEndHour, breakEndMinute] = workingHours.breakEnd
        .split(":")
        .map(Number);

      breakStart = dayjs()
        .hour(breakStartHour)
        .minute(breakStartMinute)
        .second(0);
      breakEnd = dayjs().hour(breakEndHour).minute(breakEndMinute).second(0);
    }

    // Generate slots at 40-minute intervals
    while (currentTime.isBefore(endTime)) {
      // Skip slots during break time
      if (breakStart && breakEnd) {
        if (currentTime.isAfter(breakStart) && currentTime.isBefore(breakEnd)) {
          currentTime = currentTime.add(40, "minute");
          continue;
        }
      }

      slots.push({
        time: currentTime.format("HH:mm"),
        isAvailable: true,
      });

      currentTime = currentTime.add(40, "minute");
    }

    return slots;
  };

  // Fetch appointments for the selected date to show which slots are booked
  const fetchAppointments = async () => {
    try {
      const response = await fetch(
        SERVER_URL(`api/appointments/:${formattedDate}`)
      );

      if (response.ok) {
        const data = await response.json();

        // Update time slots availability based on appointments
        const updatedSlots = timeSlots.map((slot) => {
          const isBooked = data.appointments.some(
            (appointment) =>
              appointment.timeSlot === slot.time &&
              appointment.status === "Confirmed"
          );

          return {
            ...slot,
            isAvailable: !isBooked,
          };
        });
        if (updatedSlots.length > 0) {
          setTimeSlots(updatedSlots);
        }
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const handleSaveWorkingHours = async () => {
    try {
      setSaving(true);

      const response = await fetch(
        SERVER_URL("api/schedule/set-working-hours"),
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: formattedDate,
            startTime: workingHours.startTime,
            endTime: workingHours.endTime,
            breakStart: workingHours.breakStart,
            breakEnd: workingHours.breakEnd,
          }),
        }
      );

      if (response.ok) {
        addAlert("Working hours updated successfully", ALERT_TYPES.SUCCESS);
        fetchWorkingHours(); // Refresh data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update working hours");
      }
    } catch (error) {
      addAlert(
        `Error updating working hours: ${error.message}`,
        ALERT_TYPES.ERROR
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle time change inputs
  const handleTimeChange = (field, value) => {
    setWorkingHours((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  useEffect(() => {
    fetchWorkingHours();
  }, [formattedDate]);

  useEffect(() => {
    const slots = generateTimeSlots();
    setTimeSlots(slots);

    if (slots.length > 0) {
      fetchAppointments();
    }
  }, [workingHours, formattedDate]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Schedule Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Select Date</h2>
            <DateCalendar
              value={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate)}
            />
          </div>
        </div>

        {/* Working Hours Settings */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Working Hours</h2>

            {loading ? (
              <div className="flex justify-center p-4">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Start Time</span>
                  </label>
                  <input
                    type="time"
                    value={workingHours.startTime}
                    onChange={(e) =>
                      handleTimeChange("startTime", e.target.value)
                    }
                    className="input input-bordered"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">End Time</span>
                  </label>
                  <input
                    type="time"
                    value={workingHours.endTime}
                    onChange={(e) =>
                      handleTimeChange("endTime", e.target.value)
                    }
                    className="input input-bordered"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Break Start (Optional)</span>
                  </label>
                  <input
                    type="time"
                    value={workingHours.breakStart}
                    onChange={(e) =>
                      handleTimeChange("breakStart", e.target.value)
                    }
                    className="input input-bordered"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Break End (Optional)</span>
                  </label>
                  <input
                    type="time"
                    value={workingHours.breakEnd}
                    onChange={(e) =>
                      handleTimeChange("breakEnd", e.target.value)
                    }
                    className="input input-bordered"
                  />
                </div>

                <button
                  className={`btn btn-primary w-full ${
                    saving ? "loading" : ""
                  }`}
                  onClick={handleSaveWorkingHours}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Working Hours"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Time Slots Preview */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Time Slots Preview</h2>

            {timeSlots.length === 0 ? (
              <div className="alert alert-info">
                <span>No time slots available. Please set working hours.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {timeSlots.map((slot, index) => (
                  <div
                    key={index}
                    className={`p-2 text-center rounded-md ${
                      slot.isAvailable
                        ? "bg-success text-success-content"
                        : "bg-error text-error-content"
                    }`}
                  >
                    {slot.time}
                    <div className="text-xs">
                      {slot.isAvailable ? "Available" : "Booked"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Special Dates Configuration */}
      <div className="card bg-base-100 shadow-xl mt-8">
        <div className="card-body">
          <h2 className="card-title mb-4">Create Special Dates</h2>

          <div className="alert alert-info mb-4">
            <span>
              You can set special working hours for holidays or other events.
              These will override the regular schedule.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Special Date</span>
              </label>
              <input type="date" className="input input-bordered" />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <input
                type="text"
                placeholder="E.g., Holiday, Special Event"
                className="input input-bordered"
              />
            </div>
          </div>

          <div className="form-control mt-4">
            <label className="label cursor-pointer">
              <span className="label-text">Closed Day</span>
              <input type="checkbox" className="toggle toggle-primary" />
            </label>
          </div>

          <div className="form-control mt-4">
            <button className="btn btn-primary">Add Special Date</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleManagement;
