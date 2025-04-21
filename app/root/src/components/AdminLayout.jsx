import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { ScissorsIcon, CalendarIcon, ClockIcon, BeardIcon, UsersIcon } from './BarberIcons';
import AuthContext from '../context/AuthContext';
import AlertContext from '../context/AlertContext';
import ALERT_TYPES from '../constants/alertTypeConstants';
import { logout } from '../service/authentication-service';

const AdminLayout = () => {
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
  const { addAlert } = useContext(AlertContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      setIsLoggedIn({ status: false, user: {} });
      addAlert('Logged out successfully', ALERT_TYPES.SUCCESS);
      navigate('/auth', { state: { auth: 'login' } });
    } catch (error) {
      addAlert(`Error logging out: ${error.message}`, ALERT_TYPES.ERROR);
    }
  };

  return (
    <div className="flex flex-col justify-items-center  md:w-full  md:flex-row h-screen bg-base-100">
      {/* Sidebar for desktop */}
      <div className="hidden  md:flex md:w-64 bg-base-200 flex-col">
        <div className="p-4 border-b border-base-300">
          <h1 className="text-2xl font-bold">BARBERIA</h1>
          <p className="text-sm opacity-70">Admin Dashboard</p>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-3">
            <li>
              <NavLink 
                to="/admin" 
                end
                className={({isActive}) => 
                  `flex items-center p-3 rounded-lg ${isActive ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`
                }
              >
                <ScissorsIcon size={20} className="mr-3" />
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/admin/appointments" 
                className={({isActive}) => 
                  `flex items-center p-3 rounded-lg ${isActive ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`
                }
              >
                <CalendarIcon size={20} className="mr-3" />
                Appointments
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/admin/schedule" 
                className={({isActive}) => 
                  `flex items-center p-3 rounded-lg ${isActive ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`
                }
              >
                <ClockIcon size={20} className="mr-3" />
                Working Hours
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/admin/users" 
                className={({isActive}) => 
                  `flex items-center p-3 rounded-lg ${isActive ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`
                }
              >
                <UsersIcon size={20} className="mr-3" />
                Users
              </NavLink>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t border-base-300">
          <div className="flex items-center mb-4">
            <div className="avatar placeholder mr-3">
              <div className="bg-neutral text-neutral-content rounded-full w-10">
                <span>{isLoggedIn.user.firstname?.[0]}{isLoggedIn.user.lastname?.[0]}</span>
              </div>
            </div>
            <div>
              <div className="font-medium">{`${isLoggedIn.user.firstname} ${isLoggedIn.user.lastname}`}</div>
              <div className="text-xs opacity-70">Administrator</div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <NavLink to="/" className="btn btn-sm btn-outline flex-1">
              Storefront
            </NavLink>
            <button onClick={handleLogout} className="btn btn-sm btn-error flex-1">
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile header */}
      <div className="md:hidden bg-base-200 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">BARBERIA Admin</h1>
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </label>
            <ul tabIndex={0} className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <NavLink to="/admin" end>
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/appointments">
                  Appointments
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/schedule">
                  Working Hours
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/users">
                  Users
                </NavLink>
              </li>
              <li>
                <NavLink to="/">
                  Storefront
                </NavLink>
              </li>
              <li>
                <button onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1  overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;