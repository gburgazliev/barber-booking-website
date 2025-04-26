import React, { useState, useEffect, useContext } from "react";
import { SERVER_URL } from "../constants/serverUrl";
import AlertContext from "../context/AlertContext";
import ALERT_TYPES from "../constants/alertTypeConstants";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs from "dayjs";

/**
 * Admin component for managing barber shop appointments
 * Allows viewing, canceling, and creating appointments
 * Handles special slot types (shifted and intermediate slots)
 */
const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [attended, setAttended] = useState(null);
  const [availableServices, setAvailableServices] = useState({
    Hair: true,
    Beard: true,
    "Hair and Beard": true,
  });
  const { addAlert } = useContext(AlertContext);

  const formattedDate = selectedDate.format("YYYY-MM-DD");

  // Generate all possible time slots for the day (40-minute intervals)
  const generateAllTimeSlots = () => {
    const slots = [];
    let startTime = dayjs().hour(9).minute(0);
    const endTime = dayjs().hour(19).minute(0);

    while (startTime.isBefore(endTime)) {
      slots.push(startTime.format("HH:mm"));
      startTime = startTime.add(40, "minute");
    }

    return slots;
  };

  // Fetch schedule and appointments for the selected date
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch appointments and special slots
      const appointmentsResponse = await fetch(
        SERVER_URL(`api/appointments/:${formattedDate}`),
        {
          credentials: "include",
        }
      );

      if (!appointmentsResponse.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const appointmentsData = await appointmentsResponse.json();
      console.log("API response:", appointmentsData);

      setAppointments(appointmentsData.appointments || []);

      // Get all possible time slots
      const allTimeSlots = generateAllTimeSlots();
      console.log("All slots generated:", allTimeSlots);

      // Track which slots are booked or blocked
      const bookedSlots = new Set();

      // Add confirmed appointments to bookedSlots
      (appointmentsData.appointments || []).forEach((appointment) => {
        bookedSlots.add(appointment.timeSlot);

        // If it's "Hair and Beard" appointment, also block the next slot
        if (appointment.type === "Hair and Beard") {
          const [hours, minutes] = appointment.timeSlot.split(":").map(Number);
          let newHours = hours;
          let newMinutes = minutes + 40;

          if (newMinutes >= 60) {
            newMinutes -= 60;
            newHours += 1;
          }

          const nextSlot = `${String(newHours).padStart(2, "0")}:${String(
            newMinutes
          ).padStart(2, "0")}`;
          bookedSlots.add(nextSlot);
        }
      });

      // Add blocked slots to the set
      (appointmentsData.blockedSlots || []).forEach((slot) => {
        bookedSlots.add(slot.timeSlot);
      });

      console.log("Booked slots:", [...bookedSlots]);

      // Filter out booked slots
      let available = allTimeSlots.filter((slot) => !bookedSlots.has(slot));
      console.log("Available regular slots after filtering:", available);

      // Add shifted slots that aren't booked
      (appointmentsData.shiftedSlots || []).forEach((slot) => {
        // Only add if it's not booked and not already in available slots or bookedSlots
        if (
          !slot.isBooked &&
          !available.includes(slot.shiftedTime) &&
          !bookedSlots.has(slot.shiftedTime)
        ) {
          console.log(`Adding shifted slot: ${slot.shiftedTime}`);
          available.push(slot.shiftedTime);
        }
      });

      // Add intermediate slots that aren't booked
      (appointmentsData.intermediateSlots || []).forEach((slot) => {
        // Only add if it's not booked and not already in available slots or bookedSlots
        if (
          !slot.isBooked &&
          !available.includes(slot.slotTime) &&
          !bookedSlots.has(slot.slotTime)
        ) {
          console.log(`Adding intermediate slot: ${slot.slotTime}`);
          available.push(slot.slotTime);
        }
      });

      // Sort all slots chronologically
      available.sort((a, b) => {
        const [hoursA, minutesA] = a.split(":").map(Number);
        const [hoursB, minutesB] = b.split(":").map(Number);

        if (hoursA !== hoursB) {
          return hoursA - hoursB;
        }
        return minutesA - minutesB;
      });

      console.log("Final available slots:", available);
      setAvailableTimeSlots(available);
    } catch (error) {
      console.error("Error loading data:", error);
      addAlert(`Error loading data: ${error.message}`, ALERT_TYPES.ERROR);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [formattedDate]);

  
   const handleAttendedChange = async (value, id) => {
    
    try {
      const response = await fetch(
        SERVER_URL(`api/appointments/update-attended/:${id}`),
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ attended: value }),
        }
      );

      if (response.ok) {
        addAlert("Appointment status updated successfully", ALERT_TYPES.SUCCESS);
        fetchData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update appointment");
      }
    } catch (error) {
      addAlert(
        `Error updating appointment status: ${error.message}`,
        ALERT_TYPES.ERROR
      );
    }
  };


   
   
  

  const handleCancelAppointment = async (id) => {
    try {
      const response = await fetch(
        SERVER_URL(`api/appointments/cancel/:${id}`),
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        addAlert("Appointment cancelled successfully", ALERT_TYPES.SUCCESS);
        fetchData();
        setSelectedAppointment(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel appointment");
      }
    } catch (error) {
      addAlert(
        `Error cancelling appointment: ${error.message}`,
        ALERT_TYPES.ERROR
      );
    }
  };

  // Update available services based on selected time slot
  const updateAvailableServices = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);

    if (!timeSlot) {
      // Reset services if no time slot is selected
      setAvailableServices({
        Hair: true,
        Beard: true,
        "Hair and Beard": false,
      });
      return;
    }

    // Check if the slot has a consecutive available slot (for Hair and Beard)
    const [hours, minutes] = timeSlot.split(":").map(Number);
    let newHours = hours;
    let newMinutes = minutes + 40;

    if (newMinutes >= 60) {
      newMinutes -= 60;
      newHours += 1;
    }

    const nextSlot = `${String(newHours).padStart(2, "0")}:${String(
      newMinutes
    ).padStart(2, "0")}`;
    const hasNextSlotAvailable = availableTimeSlots.includes(nextSlot);

    // Update available services
    setAvailableServices({
      Hair: true, // Hair service always available in any slot
      Beard: true, // Beard service always available in any slot
      "Hair and Beard": hasNextSlotAvailable, // Only available if next slot is free
    });
  };

  const handleAddAppointment = async (event) => {
    event.preventDefault();

    // Get form data
    const formData = new FormData(event.target);
    const timeSlot = formData.get("timeSlot");
    const serviceType = formData.get("type");

    // Double-check service availability
    if (
      serviceType === "Hair and Beard" &&
      !availableServices["Hair and Beard"]
    ) {
      addAlert(
        "Hair and Beard service requires two consecutive slots which are not available for this time",
        ALERT_TYPES.ERROR
      );
      return;
    }

    const appointmentData = {
      date: formattedDate,
      timeSlot: timeSlot,
      type: serviceType,
      userEmail: formData.get("userEmail"),
    };

    try {
      const response = await fetch(SERVER_URL("api/admin/appointments"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });

      if (response.ok) {
        addAlert("Appointment added successfully", ALERT_TYPES.SUCCESS);
        fetchData();
        document.getElementById("add_appointment_modal").close();
        event.target.reset();
        setSelectedTimeSlot("");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add appointment");
      }
    } catch (error) {
      addAlert(`Error adding appointment: ${error.message}`, ALERT_TYPES.ERROR);
    }
  };

  return (
    <div className="p-6 w-full">
      <div className="flex sm:justify-center sm:flex-col md:flex-row md:justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Appointment Management</h1>
        <button
          className="btn btn-primary"
          onClick={() =>
            document.getElementById("add_appointment_modal").showModal()
          }
        >
          Add Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-full">
        {/* Calendar */}
        <div className="card bg-base-100 sm:!p-0 md:!p-6 shadow-xl w-full overflow-hidden">
          <div className="card-body p-0">
            <h2 className="card-title mb-4">Select Date</h2>
            <div className="overflow-x-auto max-w-full">
              <DateCalendar
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                disablePast
                className="bg-white shadow-md max-w-full"
                sx={{
                  padding: 0,
                  margin: 0,
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                }}
              />
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="card bg-base-100 shadow-xl lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title mb-4">
              Appointments for {formattedDate}
            </h2>

            {loading ? (
              <div className="flex justify-center p-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : appointments.length === 0 ? (
              <div className="alert alert-info">
                <span>No appointments found for this date.</span>
              </div>
            ) : (
              <div className="overflow-x-auto max-w-full">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Status</th>
                      <th>Actions</th>
                      <th>Attendence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => (
                      <tr key={appointment._id} className="hover">
                        <td>{appointment.timeSlot}</td>
                        <td>{`${appointment.userId.firstname} ${appointment.userId.lastname}`}</td>
                        <td>{appointment.type}</td>

                        <td>
                          <span
                            className={`badge ${
                              appointment.status === "Confirmed"
                                ? "badge-success"
                                : "badge-warning"
                            }`}
                          >
                            {appointment.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex space-x-2">
                            <button
                              className="btn btn-xs btn-info"
                              onClick={() =>
                                setSelectedAppointment(appointment)
                              }
                            >
                              Details
                            </button>
                            <button
                              className="btn btn-xs btn-error"
                              onClick={() =>
                                handleCancelAppointment(appointment._id)
                              }
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                        <td>
                          {appointment.attended === null ? (
                            <select
                              name="attended"
                              onChange={(e) => handleAttendedChange(e.target.value, appointment._id)}
                            >
                              <option value="''">Select...</option>
                              <option value="true">Yes</option>
                              <option value="false">No</option>
                            </select>
                          ) : (
                            <span className="text-gray-500">{appointment.attended ? 'Attended' :  "Did not attend"  }</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="card bg-base-100 shadow-xl mt-8">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <h2 className="card-title">Appointment Details</h2>
              <button
                className="btn btn-sm btn-circle"
                onClick={() => setSelectedAppointment(null)}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <h3 className="font-bold">Customer Information</h3>
                <p>
                  Name:{" "}
                  {`${selectedAppointment.userId.firstname} ${selectedAppointment.userId.lastname}`}
                </p>
                <p>Email: {selectedAppointment.userId.email}</p>
              </div>

              <div>
                <h3 className="font-bold">Appointment Information</h3>
                <p>Date: {selectedAppointment.date}</p>
                <p>Time: {selectedAppointment.timeSlot}</p>
                <p>Service: {selectedAppointment.type}</p>
                <p>Status: {selectedAppointment.status}</p>
                {selectedAppointment.isShiftedSlot && <p>Shifted Slot: Yes</p>}
                {selectedAppointment.isIntermediateSlot && (
                  <p>Intermediate Slot: Yes</p>
                )}
                <p>Duration: {selectedAppointment.duration} minutes</p>
              </div>
            </div>

            <div className="card-actions justify-end mt-4">
              <button
                className="btn btn-error"
                onClick={() => handleCancelAppointment(selectedAppointment._id)}
              >
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Appointment Modal */}
      <dialog id="add_appointment_modal" className="modal">
        <div className="modal-box max-w-lg overflow-y-auto max-h-[90vh]">
          <h3 className="font-bold text-lg mb-4">Add New Appointment</h3>
          <form onSubmit={handleAddAppointment}>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Time Slot</span>
              </label>
              <select
                name="timeSlot"
                className="select select-bordered w-full"
                required
                value={selectedTimeSlot}
                onChange={(e) => updateAvailableServices(e.target.value)}
              >
                <option value="" disabled>
                  Select a time slot
                </option>
                {availableTimeSlots.length > 0 ? (
                  availableTimeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No available slots for this date
                  </option>
                )}
              </select>
              {availableTimeSlots.length === 0 && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    All slots are booked or blocked for this date
                  </span>
                </label>
              )}
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Service Type</span>
              </label>
              <select
                name="type"
                className="select select-bordered w-full"
                required
              >
                <option value="" disabled selected>
                  Select a service
                </option>
                <option value="Hair" disabled={!availableServices["Hair"]}>
                  Hair{" "}
                  {!availableServices["Hair"] &&
                    "(Not available for this slot)"}
                </option>
                <option value="Beard" disabled={!availableServices["Beard"]}>
                  Beard{" "}
                  {!availableServices["Beard"] &&
                    "(Not available for this slot)"}
                </option>
                <option
                  value="Hair and Beard"
                  disabled={!availableServices["Hair and Beard"]}
                >
                  Hair and Beard{" "}
                  {!availableServices["Hair and Beard"] &&
                    "(Requires consecutive slot)"}
                </option>
              </select>
              {selectedTimeSlot && !availableServices["Hair and Beard"] && (
                <label className="label">
                  <span className="label-text-alt text-warning">
                    Hair and Beard service requires two consecutive slots
                  </span>
                </label>
              )}
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Customer email</span>
              </label>
              <input
                type="email"
                name="userEmail"
                placeholder="Enter customer email"
                className="input input-bordered w-full"
                required
              />
              <label className="label">
                <span className="label-text-alt">
                  Enter the email of the registered customer
                </span>
              </label>
            </div>

            <div className="modal-action">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={availableTimeSlots.length === 0}
              >
                Add Appointment
              </button>
              <button
                type="button"
                className="btn"
                onClick={() =>
                  document.getElementById("add_appointment_modal").close()
                }
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
};

export default AppointmentManagement;
