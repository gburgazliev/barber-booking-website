import React, { useState, useEffect, useContext } from 'react';
import { SERVER_URL } from '../constants/serverUrl';
import AlertContext from '../context/AlertContext';
import ALERT_TYPES from '../constants/alertTypeConstants';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs from 'dayjs';

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const { addAlert } = useContext(AlertContext);
  
  const formattedDate = selectedDate.format('YYYY-MM-DD');
  
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch(SERVER_URL(`api/admin/appointments/${formattedDate}`), {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch appointments');
      }
    } catch (error) {
      addAlert(`Error loading appointments: ${error.message}`, ALERT_TYPES.ERROR);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAppointments();
  }, [formattedDate]);
  
  const handleCancelAppointment = async (id) => {
    try {
      const response = await fetch(SERVER_URL(`api/admin/appointments/${id}`), {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        addAlert('Appointment cancelled successfully', ALERT_TYPES.SUCCESS);
        fetchAppointments();
        setSelectedAppointment(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel appointment');
      }
    } catch (error) {
      addAlert(`Error cancelling appointment: ${error.message}`, ALERT_TYPES.ERROR);
    }
  };
  
  const handleAddAppointment = async (event) => {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(event.target);
    const appointmentData = {
      date: formattedDate,
      timeSlot: formData.get('timeSlot'),
      type: formData.get('type'),
      userId: formData.get('userId'),
      status: 'Confirmed'
    };
    
    try {
      const response = await fetch(SERVER_URL('api/admin/appointments'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });
      
      if (response.ok) {
        addAlert('Appointment added successfully', ALERT_TYPES.SUCCESS);
        fetchAppointments();
        document.getElementById('add_appointment_modal').close();
        event.target.reset();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add appointment');
      }
    } catch (error) {
      addAlert(`Error adding appointment: ${error.message}`, ALERT_TYPES.ERROR);
    }
  };
  
  // Generate time slots for the form
  const generateTimeSlots = () => {
    const slots = [];
    let startTime = dayjs().hour(9).minute(0);
    const endTime = dayjs().hour(19).minute(0);
    
    while (startTime.isBefore(endTime)) {
      slots.push(startTime.format('HH:mm'));
      startTime = startTime.add(40, 'minute');
    }
    
    return slots;
  };
  
  const timeSlots = generateTimeSlots();
  
  return (
    <div className="p-6 w-full">
      <div className="flex sm:justify-center sm:flex-col  md:flex-row md:justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Appointment Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => document.getElementById('add_appointment_modal').showModal()}
        >
          Add Appointment
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-full">
        {/* Calendar */}
        <div className="card bg-base-100 sm:!p-0 md:!p-6  shadow-xl w-full overflow-hidden">
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
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
  
        }}
      />
    </div>
  </div>
</div>

        {/* Appointments List */}
        <div className="card bg-base-100 shadow-xl lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title mb-4">Appointments for {formattedDate}</h2>
            
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
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(appointment => (
                      <tr key={appointment._id} className="hover">
                        <td>{appointment.timeSlot}</td>
                        <td>{`${appointment.userId.firstname} ${appointment.userId.lastname}`}</td>
                        <td>{appointment.type}</td>
                        <td>
                          <span className={`badge ${appointment.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex space-x-2">
                            <button 
                              className="btn btn-xs btn-info"
                              onClick={() => setSelectedAppointment(appointment)}
                            >
                              Details
                            </button>
                            <button 
                              className="btn btn-xs btn-error"
                              onClick={() => handleCancelAppointment(appointment._id)}
                            >
                              Cancel
                            </button>
                          </div>
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
                <p>Name: {`${selectedAppointment.userId.firstname} ${selectedAppointment.userId.lastname}`}</p>
                <p>Email: {selectedAppointment.userId.email}</p>
              </div>
              
              <div>
                <h3 className="font-bold">Appointment Information</h3>
                <p>Date: {selectedAppointment.date}</p>
                <p>Time: {selectedAppointment.timeSlot}</p>
                <p>Service: {selectedAppointment.type}</p>
                <p>Status: {selectedAppointment.status}</p>
                {selectedAppointment.isShiftedSlot && <p>Shifted Slot: Yes</p>}
                {selectedAppointment.isIntermediateSlot && <p>Intermediate Slot: Yes</p>}
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
              <select name="timeSlot" className="select select-bordered w-full" required>
                <option value="" disabled selected>Select a time slot</option>
                {timeSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Service Type</span>
              </label>
              <select name="type" className="select select-bordered w-full" required>
                <option value="" disabled selected>Select a service</option>
                <option value="Hair">Hair</option>
                <option value="Beard">Beard</option>
                <option value="Hair and Beard">Hair and Beard</option>
              </select>
            </div>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Customer ID</span>
              </label>
              <input
                type="text"
                name="userId"
                placeholder="Enter customer ID"
                className="input input-bordered w-full"
                required
              />
              <label className="label">
                <span className="label-text-alt">Enter the MongoDB ObjectId of the customer</span>
              </label>
            </div>
            
            <div className="modal-action">
              <button type="submit" className="btn btn-primary">Add Appointment</button>
              <button type="button" className="btn" onClick={() => document.getElementById('add_appointment_modal').close()}>Cancel</button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
};

export default AppointmentManagement;