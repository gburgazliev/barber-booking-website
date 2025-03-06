import React, { memo, useState, useEffect, useContext } from "react";
import ALERT_TYPES from "../constants/alertTypeConstants";
import AlertContext from "../context/AlertContext";
import { SERVER_URL } from "../constants/serverUrl";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { cancelAppointment } from "../service/appointment-service";
import CountdownTimer from "./CountdownTimer";

const Appointment = memo(
  ({ timeSlot, date, appointments, setCurrentUserAppointments }) => {
    const [selectedService, setSelectedService] = useState("");
    const [selectedServiceText, setSelectedServiceText] = useState("");
    const [expiryTimestamp, setExpiryTimestamp] = useState(null);
    const [canCancel, setCanCancel] = useState(true);
    const [currentUserAppointment, setCurrentUserAppointment] = useState({});
    const [isCurrentUserAppointment, setIsCurrentUserAppointment] =
      useState(false);
    const { addAlert } = useContext(AlertContext);
    const { isLoggedIn } = useContext(AuthContext);
    const navigate = useNavigate();
    const modalId = `modal_${date}_${timeSlot.replace(":", "")}`;
    const CANCEL_APPOINTMENT_TIME = 600;

    const handleSelectChange = (e) => {
      const fullText = e.target.options[e.target.selectedIndex].text;
      const [serviceName] = fullText.split(" - ");
      setSelectedService(e.target.value);
      setSelectedServiceText(serviceName);
    };

    const handleModalClose = () => {
      setSelectedService("");
      setSelectedServiceText("");
    };

    const bookAppointment = async () => {
      try {
        if (!selectedService) {
          throw new Error("You should select a service first !");
        }
        const response = await fetch(SERVER_URL("api/appointments/book"), {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ timeSlot, date, type: selectedService }),
        });
        if (response.status === 401) {
          navigate("auth", { state: { auth: "login" } });
          return;
        }
        if (response.ok) {
          addAlert(
            "Confirmation email has been sent",
            ALERT_TYPES.INFO,
            "center",
            false,
            true,
            true,
            null
          );
        } else {
          throw new Error("Only 1 appointment per day !");
        }
      } catch (error) {
        addAlert(
          error.message,
          undefined,
          undefined,
          undefined,
          false,
          false,
          3000
        );
      } finally {
        handleModalClose();
      }
    };

    const handleCancelAppointment = async () => {
      try {
        const response = await cancelAppointment(currentUserAppointment._id);

        if (response.ok) {
          const parseResponse = await response.json();
          addAlert(
            parseResponse.body,
            ALERT_TYPES.SUCCESS,
            undefined,
            true,
            false,
            false,
            3000
          );
        } else {
          throw new Error("Error canceling appointment. Try again.");
        }
      } catch (error) {
        addAlert(error.message, undefined, undefined, true, false, false, 3000);
      }
    };
    const modalContent = isCurrentUserAppointment ? (
      <div className="flex flex-col gap-2 p-2v items-center">
        <p>You have already booked an appointment for this slot.</p>
        {expiryTimestamp && (
          <CountdownTimer
            expiryTimestamp={expiryTimestamp}
            setCanCancel={setCanCancel}
          />
        )}
        {canCancel && (
          
            <button
              className="w-1/2 bg-red-800 "
              onClick={handleCancelAppointment}
            >
              Cancel
            </button>
         
        )}
      </div>
    ) : (
      <div className="flex flex-col gap-2 p-2">
        <select
          className="select select-bordered w-full max-w-xs"
          value={selectedService}
          onChange={handleSelectChange}
        >
          <option disabled value="">
            Choose service
          </option>
          <option value="Hair">Hair - 20lv</option>
          <option value="Hair and Beard">Hair and Beard - 30lv</option>
          <option value="Beard">Beard - 20lv</option>
        </select>

        <form method="dialog">
          <button className="w-1/2" onClick={bookAppointment}>
            Book
          </button>
        </form>
      </div>
    );
    useEffect(() => {
      // check if the appointment is current user's appointment
      if (!appointments || !isLoggedIn.user?._id) return;
      const currentUserAppointment = appointments.find(
        (appointment) =>
          appointment.userId._id === isLoggedIn?.user._id &&
          appointment.date === date &&
          appointment.timeSlot === timeSlot
      );

      if (currentUserAppointment) {
        setCurrentUserAppointments(currentUserAppointment);
        const date = new Date(currentUserAppointment.bookedAt);
        const cancelDeadline = new Date(date);
        cancelDeadline.setSeconds(
          cancelDeadline.getSeconds() + CANCEL_APPOINTMENT_TIME
        );

        // Check if we're still within the cancellation window

        // Set expiry timestamp for the timer
        setExpiryTimestamp(cancelDeadline);
      }
      setCurrentUserAppointment(
        currentUserAppointment ? currentUserAppointment : {}
      );
      setIsCurrentUserAppointment(currentUserAppointment ? true : false);
    }, [appointments, isLoggedIn, date, timeSlot, setCurrentUserAppointments]);

    return (
      <>
        <button
          className="btn"
          onClick={() => document.getElementById(modalId).showModal()}
        >
          {timeSlot}
        </button>
        <dialog id={modalId} className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Book your appointment here!</h3>
            {modalContent}
            <div className="modal-action">
              <form method="dialog">
                {/* if there is a button in form, it will close the modal */}
                <button className="btn" onClick={handleModalClose}>
                  Close
                </button>
              </form>
            </div>
          </div>
        </dialog>
      </>
    );
  }
);

Appointment.displayName = "Appointment";

export default Appointment;
