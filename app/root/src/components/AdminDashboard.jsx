import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import AlertContext from "../context/AlertContext";
import ALERT_TYPES from "../constants/alertTypeConstants";
import { SERVER_URL } from "../constants/serverUrl";
import {
  BarChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
} from "recharts";
import {
  CalendarIcon,
  ClockIcon,
  BeardIcon,
  ScissorsIcon,
} from "./BarberIcons";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    todayCount: 0,
    weekCount: 0,
    monthCount: 0,
    appointmentsByDay: [],
    serviceDistribution: [],
    recentAppointments: [],
  });
  const [loading, setLoading] = useState(true);
  const { addAlert } = useContext(AlertContext);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(SERVER_URL("api/admin/stats"), {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch dashboard data");
      }
    } catch (error) {
      addAlert(
        `Error loading dashboard data: ${error.message}`,
        ALERT_TYPES.ERROR
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);



  // Colors for pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

  // Data for weekly appointments chart


  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="p-6 ">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl sm:text-xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2 sm:flex-col md:flex-row">
          <button className="btn btn-primary" onClick={fetchStats}>
            Refresh Data
          </button>
          <Link to="/admin/schedule" className="btn btn-outline">
            Manage Schedule
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-primary text-primary-content shadow-xl">
          <div className="card-body">
            <div className="flex justify-between">
              <h2 className="card-title">Today</h2>
              <CalendarIcon size={24} />
            </div>
            <p className="text-4xl font-bold">{stats.todayCount}</p>
            <p className="text-sm opacity-80">Appointments today</p>
          </div>
        </div>

        <div className="card bg-secondary text-secondary-content shadow-xl">
          <div className="card-body">
            <div className="flex justify-between">
              <h2 className="card-title">This Week</h2>
              <ClockIcon size={24} />
            </div>
            <p className="text-4xl font-bold">{stats.weekCount}</p>
            <p className="text-sm opacity-80">Appointments this week</p>
          </div>
        </div>

        <div className="card bg-accent text-accent-content shadow-xl">
          <div className="card-body">
            <div className="flex justify-between">
              <h2 className="card-title">This Month</h2>
              <ClockIcon size={24} />
            </div>
            <p className="text-4xl font-bold">{stats.monthCount}</p>
            <p className="text-sm opacity-80">Appointments this month</p>
          </div>
        </div>

        <div className="card bg-neutral text-neutral-content shadow-xl">
          <div className="card-body">
            <div className="flex justify-between">
              <h2 className="card-title">Most Popular</h2>
              <ScissorsIcon size={24} />
            </div>
            <p className="text-4xl font-bold">
              {stats.serviceDistribution.length > 0
                ? stats.serviceDistribution.sort((a, b) => b.value - a.value)[0]
                    .name
                : "N/A"}
            </p>
            <p className="text-sm opacity-80">Most requested service</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Service Distribution Chart */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Service Distribution</h2>
            {stats.serviceDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.serviceDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label
                  >
                    {stats.serviceDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Trend Chart */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Weekly Appointment Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.appointmentsByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appointments" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Appointments Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body ">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">Recent Appointments</h2>
            <Link to="/admin/appointments" className="btn btn-sm btn-primary">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAppointments &&
                stats.recentAppointments.length > 0 ? (
                  stats.recentAppointments.map((appointment) => (
                    <tr key={appointment._id}>
                      <td>{appointment.date}</td>
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No recent appointments
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
