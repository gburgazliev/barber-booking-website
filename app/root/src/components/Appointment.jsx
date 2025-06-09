import React, { memo, useState, useEffect, useContext } from "react";
import ALERT_TYPES from "../constants/alertTypeConstants";
import AlertContext from "../context/AlertContext";
import { SERVER_URL } from "../constants/serverUrl";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { cancelAppointment } from "../service/appointment-service";
import CountdownTimer from "./CountdownTimer";

const Appointment = memo(
  ({
    timeSlot,
    date,
    appointments,
    setCurrentUserAppointments,
    refreshAppointments,
    timeSlots,
    calculateNextTimeSlot,
    isRegularSlot,
    userAppointment,
    slotDuration = 40,
    isShiftedSlot = false,
    isIntermediateSlot = false,
    prices = {},
  }) => {
    const [selectedService, setSelectedService] = useState("");
    const [selectedServiceText, setSelectedServiceText] = useState("");
    const [expiryTimestamp, setExpiryTimestamp] = useState(null);
    const [canCancel, setCanCancel] = useState(true);
    const [canceled, setCanceled] = useState(false);
    const [currentUserAppointment, setCurrentUserAppointment] = useState({});
    const [isCurrentUserAppointment, setIsCurrentUserAppointment] =
      useState(false);
    const [isHairAndBeardAvailable, setIsHairAndBeardAvailable] =
      useState(true);
    const [useDiscount, setUseDiscount] = useState(false);
    const { addAlert } = useContext(AlertContext);
    const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
    const navigate = useNavigate();
    const modalId = `modal_${date}_${timeSlot.replace(":", "")}`;
    const CANCEL_APPOINTMENT_TIME = 600;

    // Add special styling based on slot type
    const getSlotStyle = () => {
      let className = "btn";

      if (isShiftedSlot) {
        className += " bg-purple-600 hover:bg-purple-700"; // Purple for shifted slots
      } else if (isIntermediateSlot) {
        className += " bg-green-600 hover:bg-green-700"; // Green for intermediate slots
      } else if (!isRegularSlot) {
        className += " bg-blue-600 hover:bg-blue-700"; // Blue for 30-minute slots
      }

      return className;
    };

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
          throw new Error("You should select a service first!");
        }

        if (
          slotDuration === 30 &&
          selectedService !== "Beard" &&
          selectedService !== "Hair"
        ) {
          throw new Error(
            "Only Beard or Hair service can be booked in 30-minute slots!"
          );
        }

        const response = await fetch(SERVER_URL("api/appointments/book"), {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            timeSlot,
            date,
            type: selectedService,
            duration: slotDuration,
            isShiftedSlot,
            isIntermediateSlot,
            useDiscount: useDiscount,
          }),
        });

        // if (response.status === 401) {
        //   navigate("auth", { state: { auth: "login" } });
        //   return;
        // }

        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn((prev) => ({
            ...prev,
            user: {
              ...prev.user,
              attendance: data.user.attendance,
              discountEligible: data.user.discountEligible,
            },
          }));
          addAlert(
            "Confirmation email has been sent",
            ALERT_TYPES.INFO,
            "center",
            false,
            true,
            true,
            null
          );

          if (refreshAppointments) {
            refreshAppointments();
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Only 1 appointment per day!");
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
      }
    };

    const handleCancelAppointment = async () => {
      try {
        const response = await cancelAppointment(currentUserAppointment._id);

        if (response.ok) {
          const parseResponse = await response.json();
          setCanceled(true);
          setCanCancel(false);
          setIsCurrentUserAppointment(false);
          setCurrentUserAppointments({});
          if (refreshAppointments) {
            refreshAppointments();
          }
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

    // Add slot type information to the modal title
    const getSlotTypeTitle = () => {
      if (isShiftedSlot) return "Shifted Slot (40 minutes)";
      if (isIntermediateSlot) return "Intermediate Slot (30 minutes)";
      if (!isRegularSlot) return "Short Slot (30 minutes)";
      return "Regular Slot (40 minutes)";
    };
    // Add this helper function inside your Appointment component, before the return statement
    const getDisplayPrice = () => {
      if (!selectedService || !prices[selectedService]) return 0;

      if (useDiscount) {
        return prices[selectedService] / 2;
      }

      return prices[selectedService];
    };

    const getRegularPrice = () => {
      if (!selectedService || !prices[selectedService]) return 0;
      return prices[selectedService];
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
    ) : canceled ? (
      <div>Appointment canceled</div>
    ) : (
      <div className="flex flex-col gap-2 p-2">
        {slotDuration === 30 ? (
          // For 30-minute slots, only Beard and Hair services are available
          <select
            className="select select-bordered w-full max-w-xs"
            value={selectedService}
            onChange={handleSelectChange}
          >
            <option disabled value="">
              Choose service
            </option>
            <option value="Beard">Beard - 20lv</option>
            <option value="Hair">Hair - 20lv</option>
          </select>
        ) : (
          // For regular 40-minute slots
          <select
            className="select select-bordered w-full max-w-xs"
            value={selectedService}
            onChange={handleSelectChange}
          >
            <option disabled value="">
              Choose service
            </option>
            <option value="Hair">Hair</option>
            <option value="Hair and Beard" disabled={!isHairAndBeardAvailable}>
              Hair and Beard
              {!isHairAndBeardAvailable && "(Requires consecutive slot)"}
            </option>
            <option value="Beard">Beard</option>
          </select>
        )}

        {/* Enhanced discount checkbox and price display */}
        {isLoggedIn.user?.discountEligible && selectedService && (
          <div className="form-control mt-3">
            <label className="label cursor-pointer justify-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200">
              <input
                type="checkbox"
                className="checkbox checkbox-accent checkbox-lg"
                checked={useDiscount}
                onChange={(e) => setUseDiscount(e.target.checked)}
              />
              <div className="flex flex-col">
                <span className="label-text font-semibold text-purple-700">
                  🎉 Use my 50% discount
                </span>
                <span className="text-xs text-purple-500 opacity-75">
                  Congratulations! You've completed 5 visits
                </span>
              </div>
            </label>

            {/* Enhanced Price Display */}
            {useDiscount ? (
              <div className="mt-3 p-4 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  {/* Discount Badge */}
                  <div className="flex items-center gap-2">
                    <div className="badge badge-error badge-lg px-3 py-1 text-white font-bold animate-pulse">
                      50% OFF
                    </div>
                  </div>

                  {/* Savings Amount */}
                  <div className="text-right">
                    <div className="text-xs text-green-600 font-medium">
                      You save:{" "}
                      {(getRegularPrice() - getDisplayPrice()).toFixed(2)} lv
                    </div>
                  </div>
                </div>

                {/* Price Comparison */}
                <div className="mt-3 flex items-center justify-center gap-4">
                  {/* Original Price */}
                  <div className="text-center">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Regular Price
                    </div>
                    <div className="relative">
                      <span className="text-lg font-bold text-gray-400 line-through decoration-red-500 decoration-2">
                        {getRegularPrice()} lv
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="text-2xl text-green-500 animate-bounce">
                    →
                  </div>

                  {/* Discounted Price */}
                  <div className="text-center">
                    <div className="text-xs text-green-600 uppercase tracking-wide font-medium">
                      Your Price
                    </div>
                    <div className="relative">
                      <span className="text-2xl font-bold text-green-600">
                        {getDisplayPrice()} lv
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-3 text-center">
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-white bg-opacity-50 rounded-full text-xs text-green-700 font-medium">
                    ⭐ Loyalty Reward Applied
                  </div>
                </div>
              </div>
            ) : /* Regular Price Display */
            null}
          </div>
        )}
        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="text-sm text-blue-700 font-medium">
              Service Price:
            </div>
            <div className="text-lg font-bold text-blue-800">
              {getRegularPrice()} lv
            </div>
          </div>

          {/* Potential Savings Hint */}
          {!isLoggedIn.user.discountEligible && (
            <div className="flex flex-col mt-2 text-xs text-blue-600 text-center opacity-75">
              💡 Complete 5 visits to unlock 50% discount on future bookings
              <span> {isLoggedIn.user?.attendance} / 5</span>
            </div>
          )}
        </div>
        <form
          method="dialog"
          className="flex lg:justify-start lg:items-start sm:justify-end sm:items-end flex-col gap-2 mt-4"
        >
          <button className="w-1/4  text-white" onClick={bookAppointment}>
            Book
          </button>
        </form>
      </div>
    );

    useEffect(() => {
      if (!timeSlots || !appointments || !calculateNextTimeSlot) return;

      // Only check for Hair and Beard availability on regular 40-minute slots
      if (slotDuration === 40) {
        const nextTimeSlot40mins = calculateNextTimeSlot(timeSlot)[0];
        const nextTimeSlot30mins = calculateNextTimeSlot(timeSlot)[1];

        // Check if the next time slot exists in available slots
        const nextSlotOneExists = timeSlots.includes(nextTimeSlot40mins);
        const nextSlotTwoExists = timeSlots.includes(nextTimeSlot30mins);

        // If the next slot doesn't exist in available slots, Hair and Beard is not available
        setIsHairAndBeardAvailable(nextSlotOneExists || nextSlotTwoExists);
      } else {
        // 30-minute slots can't be used for Hair and Beard
        setIsHairAndBeardAvailable(false);
      }
    }, [
      timeSlot,
      timeSlots,
      appointments,
      date,
      calculateNextTimeSlot,
      slotDuration,
    ]);

    useEffect(() => {
      // Check if the appointment is current user's appointment
      if (!appointments || !isLoggedIn.user?._id) return;

      // First, check regular appointments
      const currentUserAppointment = appointments.find(
        (appointment) =>
          appointment.userId._id === isLoggedIn?.user._id &&
          appointment.date === date &&
          appointment.timeSlot === timeSlot
      );

      if (currentUserAppointment) {
        setCurrentUserAppointments(currentUserAppointment);
        const appointmentDate = new Date(currentUserAppointment.bookedAt);
        const cancelDeadline = new Date(appointmentDate);
        cancelDeadline.setSeconds(
          cancelDeadline.getSeconds() + CANCEL_APPOINTMENT_TIME
        );

        // Set expiry timestamp for the timer
        setExpiryTimestamp(cancelDeadline);
        setCurrentUserAppointment(currentUserAppointment);
        setIsCurrentUserAppointment(true);
        return;
      }

      // If no regular appointment is found, reset the state
      setCurrentUserAppointment({});
      setIsCurrentUserAppointment(false);
    }, [appointments, isLoggedIn, date, timeSlot, setCurrentUserAppointments]);

    return (
      <>
        <button
          className={getSlotStyle()}
          onClick={() => {
            document.getElementById(modalId).showModal();
            !isLoggedIn.status &&
              navigate("auth", { state: { auth: "login" } });
          }}
        >
          {timeSlot}
        </button>
        <dialog id={modalId} className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              Book your appointment here!
              <span className="text-sm block font-normal">
                {getSlotTypeTitle()}
              </span>
            </h3>
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
