import React, { memo, useState, useEffect } from "react";

const Appointment = memo(({ timeSlot, date }) => {
  const [selectedService, setSelectedService] = useState("");
  const [selectedServiceText, setSelectedServiceText] = useState("");

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

  
  return (
    <>
      <button
        className="btn"
        onClick={() => document.getElementById("my_modal_2").showModal()}
      >
        {timeSlot}
      </button>
      <dialog id="my_modal_2" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Book your appointment here!</h3>
          <div className="flex flex-col gap-2 p-2">
            <select
              className="select select-bordered w-full max-w-xs"
              value={selectedService}
              onChange={handleSelectChange}
            >
              <option disabled value="">
                Choose service
              </option>
              <option value="Hair">
                {selectedService === "Hair"
                  ? selectedServiceText
                  : "Hair - 20lv"}
              </option>
              <option value="Hair and Beard">
                {selectedService === "Hair and Beard"
                  ? selectedServiceText
                  : "Hair and Beard - 30lv"}
              </option>
              <option value="Beard">
                {selectedService === "Beard"
                  ? selectedServiceText
                  : "Beard - 20lv"}
              </option>
            </select>

            <div >
              <h2 className="text-start">Status:</h2>
            </div>
          </div>
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
});

Appointment.displayName = "Appointment";

export default Appointment;
