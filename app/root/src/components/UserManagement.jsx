import React, { useState, useEffect, useContext } from "react";
import { SERVER_URL } from "../constants/serverUrl";
import AlertContext from "../context/AlertContext";
import ALERT_TYPES from "../constants/alertTypeConstants";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAppointments, setUserAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [oldest, setOldest] = useState(false);
  const [newest, setNewest] = useState(true);
  const { addAlert } = useContext(AlertContext);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(SERVER_URL("api/admin/users"), {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch users");
      }
    } catch (error) {
      addAlert(`Error loading users: ${error.message}`, ALERT_TYPES.ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(
        SERVER_URL(`api/admin/users/${userId}/role`),
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (response.ok) {
        // Update local state
        setUsers(
          users.map((user) =>
            user._id === userId ? { ...user, role: newRole } : user
          )
        );

        addAlert("User role updated successfully", ALERT_TYPES.SUCCESS);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user role");
      }
    } catch (error) {
      addAlert(`Error updating user role: ${error.message}`, ALERT_TYPES.ERROR);
    }
  };

  const handleAttendanceChange = async (userId, newAttendance) => {
    try {
      const response = await fetch(
        SERVER_URL(`api/users/update-attendance/:${userId}`),
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ attendance: newAttendance }),
        }
      );

      if (response.ok) {
        // Update local state
        setUsers(
          users.map((user) =>
            user._id === userId ? { ...user, attendance: newAttendance } : user
          )
        );

        addAlert("User attendance updated successfully", ALERT_TYPES.SUCCESS);
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update user attendance"
        );
      }
    } catch (error) {
      addAlert(
        `Error updating user attendance: ${error.message}`,
        ALERT_TYPES.ERROR
      );
    }
  };

  const fetchUserAppointments = async (userId) => {
    try {
      setLoadingAppointments(true);
      const response = await fetch(
        SERVER_URL(`api/admin/users/${userId}/appointments`),
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserAppointments(data);
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch user appointments"
        );
      }
    } catch (error) {
      addAlert(
        `Error loading user appointments: ${error.message}`,
        ALERT_TYPES.ERROR
      );
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleViewDetails = async (user) => {
    setSelectedUser(user);
    await fetchUserAppointments(user._id);
  };

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    return (
      fullName.includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    oldest &&
      setUsers((prev) =>
        prev.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      );
    setNewest(false);
    newest &&
      setUsers((prev) =>
        prev.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      );
    setOldest(false);
  }, [oldest, newest]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">User Management</h1>

      {/* Search Bar */}
      <div className="flex gap-2 mb-6">
        <div className="form-control flex-grow">
          <div className="input-group">
            <input
              type="text"
              placeholder="Search by name or email"
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-square">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </div>
        <button className="btn btn-primary" onClick={fetchUsers}>
          Refresh
        </button>
      </div>

      {/* Users Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between w-3/4">
            <h2 className="card-title mb-4">User List</h2>

            <div className="flex flex-col">
              <h3>Sort by:</h3>
              <div className="flex gap-5 ">
                <button onClick={() => setNewest(true)}>Newest</button>
                <button onClick={() => setOldest(true)}>Oldest</button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="alert alert-info">
              <span>No users found.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover">
                      <td>{`${user.firstname} ${user.lastname}`}</td>
                      <td>{user.email}</td>
                      <td>
                        <span
                          className={`badge ${
                            user.role === "admin"
                              ? "badge-primary"
                              : "badge-ghost"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <select
                            className="select select-bordered select-sm"
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user._id, e.target.value)
                            }
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          <select
                            value={user.attendance?.toString()}
                            onChange={(e) =>
                              handleAttendanceChange(user._id, e.target.value)
                            }
                            className="select select-bordered select-sm"
                          >
                            <option value="-3">-3</option>
                            <option value="-2">-2</option>
                            <option value="-1">-1</option>
                            <option value="0">0</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                          </select>
                          <button
                            className="btn btn-xs btn-info"
                            onClick={() => handleViewDetails(user)}
                          >
                            Details
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

      {/* User Details Modal */}
      {selectedUser && (
        <div className="card bg-base-100 shadow-xl mt-8">
          <div className="card-body">
            <div className="flex justify-between">
              <h2 className="card-title">User Details</h2>
              <button
                className="btn btn-sm btn-circle"
                onClick={() => setSelectedUser(null)}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <h3 className="font-bold">Personal Information</h3>
                <p>
                  <span className="font-semibold">Name:</span>{" "}
                  {`${selectedUser.firstname} ${selectedUser.lastname}`}
                </p>
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  {selectedUser.email}
                </p>
                <p>
                  <span className="font-semibold">Role:</span>{" "}
                  {selectedUser.role}
                </p>
              </div>

              <div>
                <h3 className="font-bold">Account Status</h3>
                <div className="flex items-center mt-2">
                  <div
                    className={`badge ${
                      selectedUser.role === "admin"
                        ? "badge-primary"
                        : "badge-success"
                    } mr-2`}
                  >
                    Active
                  </div>
                </div>
              </div>
            </div>

            {/* User Appointments */}
            <div className="mt-6">
              <h3 className="font-bold">Appointment History</h3>

              {loadingAppointments ? (
                <div className="flex justify-center p-4">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : userAppointments.length === 0 ? (
                <div className="alert alert-info mt-2">
                  <span>No appointments found for this user.</span>
                </div>
              ) : (
                <div className="overflow-x-auto mt-2">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Service</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userAppointments.map((appointment) => (
                        <tr key={appointment._id} className="hover">
                          <td>{appointment.date}</td>
                          <td>{appointment.timeSlot}</td>
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
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
