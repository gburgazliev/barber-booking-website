import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";
import AlertContext from "../context/AlertContext";
import ALERT_TYPES from "../constants/alertTypeConstants";
import { SERVER_URL } from "../constants/serverUrl";
import { 
  CalendarIcon, 
  ClockIcon, 
  ScissorsIcon, 
  BeardIcon,
  EmailIcon,
  StarIcon
} from "./BarberIcons";

const Profile = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const { addAlert } = useContext(AlertContext);
  const { user } = isLoggedIn;
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    favoriteService: "None"
  });

  // Fetch user's appointments
  const fetchUserAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch(SERVER_URL(`api/admin/users/${user._id}/appointments`), {
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
        calculateStats(data);
      } else {
        throw new Error("Failed to fetch appointments");
      }
    } catch (error) {
    //   addAlert(`Error loading appointments: ${error.message}`, ALERT_TYPES.ERROR);
    } finally {
      setLoading(false);
    }
  };

  // Calculate user statistics
  const calculateStats = (appointmentData) => {
    const today = new Date().toISOString().split('T')[0];
    
    const totalAppointments = appointmentData.length;
    const upcomingAppointments = appointmentData.filter(
      apt => apt.date >= today && apt.status === 'Confirmed'
    ).length;
    const completedAppointments = appointmentData.filter(
      apt => apt.attended === true
    ).length;

    // Find favorite service
    const serviceCounts = appointmentData.reduce((acc, apt) => {
      if (apt.status === 'Confirmed') {
        acc[apt.type] = (acc[apt.type] || 0) + 1;
      }
      return acc;
    }, {});

    const favoriteService = Object.keys(serviceCounts).length > 0 
      ? Object.keys(serviceCounts).reduce((a, b) => serviceCounts[a] > serviceCounts[b] ? a : b)
      : "None";

    setStats({
      totalAppointments,
      upcomingAppointments,
      completedAppointments,
      favoriteService
    });
  };

  useEffect(() => {
    if (user?._id) {
      fetchUserAppointments();
    }
  }, [user]);

  // Get service icon
  const getServiceIcon = (serviceType, size = 20) => {
    switch (serviceType) {
      case 'Hair':
        return <ScissorsIcon size={size} />;
      case 'Beard':
        return <BeardIcon size={size} />;
      case 'Hair and Beard':
        return (
          <div className="flex gap-1">
            <ScissorsIcon size={size} />
            <BeardIcon size={size} />
          </div>
        );
      default:
        return <ScissorsIcon size={size} />;
    }
  };

  // Get status badge styling
  const getStatusBadge = (appointment) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (appointment.attended === true) {
      return <span className="badge badge-success">Completed</span>;
    } else if (appointment.attended === false) {
      return <span className="badge badge-error">Missed</span>;
    } else if (appointment.date < today) {
      return <span className="badge badge-warning">Past</span>;
    } else if (appointment.status === 'Confirmed') {
      return <span className="badge badge-info">Upcoming</span>;
    } else {
      return <span className="badge badge-ghost">{appointment.status}</span>;
    }
  };

  // Get attendance level and benefits
  const getAttendanceInfo = () => {
    const attendance = user.attendance || 0;
    let level = "Bronze";
    let nextBenefit = "";
    let progress = 0;

    if (attendance >= 5) {
      level = "Gold";
      nextBenefit = "You've unlocked 50% discount!";
      progress = 100;
    } else if (attendance >= 3) {
      level = "Silver";
      nextBenefit = `${5 - attendance} more visits for 50% discount`;
      progress = (attendance / 5) * 100;
    } else if (attendance >= 0) {
      level = "Bronze";
      nextBenefit = `${5 - attendance} visits needed for Silver level`;
      progress = Math.max(0, (attendance / 5) * 100);
    } else {
      level = "Suspended";
      nextBenefit = "Account privileges suspended";
      progress = 0;
    }

    return { level, nextBenefit, progress };
  };

  const attendanceInfo = getAttendanceInfo();

  if (!user || Object.keys(user).length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <div className="avatar placeholder mb-4">
          <div className="bg-primary text-primary-content rounded-full w-24">
            <span className="text-3xl">
              {user.firstname?.[0]}{user.lastname?.[0]}
            </span>
          </div>
        </div>
        <h1 className="text-3xl font-bold">
          {user.firstname} {user.lastname}
        </h1>
        <p className="text-lg opacity-70 flex items-center justify-center gap-2 mt-2">
          <EmailIcon size={20} />
          {user.email}
        </p>
        {user.role === 'admin' && (
          <div className="badge badge-primary badge-lg mt-2">Administrator</div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-primary text-primary-content shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="card-title text-2xl">{stats.totalAppointments}</h2>
                <p>Total Appointments</p>
              </div>
              <CalendarIcon size={32} />
            </div>
          </div>
        </div>

        <div className="card bg-secondary text-secondary-content shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="card-title text-2xl">{stats.upcomingAppointments}</h2>
                <p>Upcoming</p>
              </div>
              <ClockIcon size={32} />
            </div>
          </div>
        </div>

        <div className="card bg-accent text-accent-content shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="card-title text-2xl">{stats.completedAppointments}</h2>
                <p>Completed</p>
              </div>
              <StarIcon size={32} filled={true} />
            </div>
          </div>
        </div>

        <div className="card bg-neutral text-neutral-content shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="card-title text-lg">{stats.favoriteService}</h2>
                <p>Favorite Service</p>
              </div>
              {getServiceIcon(stats.favoriteService, 32)}
            </div>
          </div>
        </div>
      </div>

      {/* Loyalty Status */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">Loyalty Status</h2>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`badge badge-lg ${
                attendanceInfo.level === 'Gold' ? 'badge-warning' :
                attendanceInfo.level === 'Silver' ? 'badge-info' :
                attendanceInfo.level === 'Suspended' ? 'badge-error' :
                'badge-ghost'
              }`}>
                {attendanceInfo.level} Member
              </div>
              <span className="text-lg font-semibold">
                Attendance: {user.attendance || 0}
              </span>
            </div>
            
            {user.discountEligible && (
              <div className="badge badge-success badge-lg">
                🎉 Discount Available!
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress to next benefit</span>
              <span>{Math.round(attendanceInfo.progress)}%</span>
            </div>
            <progress 
              className="progress progress-primary w-full" 
              value={attendanceInfo.progress} 
              max="100"
            ></progress>
          </div>

          <p className="text-sm opacity-70">{attendanceInfo.nextBenefit}</p>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">Appointment History</h2>
          
          {loading ? (
            <div className="flex justify-center p-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg opacity-70">No appointments yet</p>
              <p className="text-sm opacity-50">Book your first appointment to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Service</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Discount</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((appointment) => (
                    <tr key={appointment._id} className="hover">
                      <td>{appointment.date}</td>
                      <td>{appointment.timeSlot}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {getServiceIcon(appointment.type)}
                          {appointment.type}
                        </div>
                      </td>
                      <td>{appointment.price} lv</td>
                      <td>{getStatusBadge(appointment)}</td>
                      <td>
                        {appointment.discountApplied ? (
                          <span className="badge badge-success">Applied</span>
                        ) : (
                          <span className="badge badge-ghost">None</span>
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

      {/* Account Settings */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">Account Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Personal Details</h3>
              <div className="space-y-2">
                <p><span className="font-medium">First Name:</span> {user.firstname}</p>
                <p><span className="font-medium">Last Name:</span> {user.lastname}</p>
                <p><span className="font-medium">Email:</span> {user.email}</p>
                <p><span className="font-medium">Member Since:</span> {new Date().getFullYear()}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Account Status</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Status:</span> 
                  <span className={`ml-2 badge ${
                    user.rights === 'suspended' ? 'badge-error' : 'badge-success'
                  }`}>
                    {user.rights === 'suspended' ? 'Suspended' : 'Active'}
                  </span>
                </p>
                <p><span className="font-medium">Role:</span> {user.role}</p>
                <p><span className="font-medium">Attendance Score:</span> {user.attendance || 0}</p>
                <p>
                  <span className="font-medium">Discount Eligible:</span> 
                  <span className={`ml-2 badge ${
                    user.discountEligible ? 'badge-success' : 'badge-ghost'
                  }`}>
                    {user.discountEligible ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;