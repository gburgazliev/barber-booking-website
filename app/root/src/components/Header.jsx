import { useEffect, useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import themeController from "../utils/themeController";
import AuthContext from "../context/AuthContext";
import { logout } from "../service/authentication-service";

/// change a with LINK
const Header = () => {
  const navigate = useNavigate();
  const { isLoggedIn, setIsLoggedIn,isLoading } = useContext(AuthContext);

  const handleLogout = async () => {
    await logout();
    setIsLoggedIn({ status: false, user: {} });

    navigate('/')
  }

  const isLoggedInConditionalRender = isLoading ? (
    <span className="loading loading-spinner loading-sm"></span>
  ) : !isLoggedIn.status ? (
    <>
      <li>
        <Link to="/auth" state={{ auth: "register" }}>
          Sign up
        </Link>
      </li>
      <li>
        <Link to="/auth" state={{ auth: "login" }}>
          Sign in
        </Link>
      </li>
    </>
  ) : (
    <li>
      <button onClick={handleLogout}>Logout</button>
    </li>
  );

  useEffect(() => {
    themeController();
  }, []);

  
  return (
    <div className="drawer">
      <input id="my-drawer-3" type="checkbox" className=" drawer-toggle" />
      <div className="drawer-content flex flex-col ">
        {/* Navbar */}
        <div className="navbar bg-base-300  w-fit rounded-full md:w-5/6 md:self-center sm:self-start">
          <div className="flex-none lg:hidden">
            <label
              htmlFor="my-drawer-3"
              aria-label="open sidebar"
              className="lg:hidden btn btn-square btn-ghost"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="inline-block h-6 w-6 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            </label>
          </div>
          <div className="hidden navbar-start lg:flex z-[1000]">
            <ul className="menu menu-horizontal ">
              {/* Navbar menu content here */}
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <a>Location</a>
              </li>
              <li></li>
            </ul>
          </div>
          <div className="hidden lg:flex navbar-end">
            <ul className="menu menu-horizontal">
              {/* Navbar menu content here */}
              <li>
                <details className="dropdown">
                  <summary role="btn ">Notifications</summary>
                  <ul className="menu dropdown-content bg-base-200 rounded-box z-[1] w-52 p-2 shadow">
                    <li>
                      <a>Item 2</a>
                    </li>
                  </ul>
                </details>
              </li>
              <li>
                <details className="dropdown">
                  <summary role="btn ">Settings</summary>
                  <ul className="menu dropdown-content bg-base-200 rounded-box z-[1] w-52 p-2 shadow">
                    <li>
                      <details className="dropdown">
                        <summary role="btn">Themes</summary>
                        <ul className="menu dropdown-content bg-base-200 rounded-box z-[1] w-52 p-2 shadow">
                          <li>
                            <input
                              type="radio"
                              name="theme-dropdown"
                              className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                              aria-label="Forest (Default)"
                              value="forest"
                            />
                          </li>
                          <li>
                            <input
                              type="radio"
                              name="theme-dropdown"
                              className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                              aria-label="Retro"
                              value="retro"
                            />
                          </li>
                          <li>
                            <input
                              type="radio"
                              name="theme-dropdown"
                              className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                              aria-label="Cyberpunk"
                              value="cyberpunk"
                            />
                          </li>
                          <li>
                            <input
                              type="radio"
                              name="theme-dropdown"
                              className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                              aria-label="Valentine"
                              value="valentine"
                            />
                          </li>
                          <li>
                            <input
                              type="radio"
                              name="theme-dropdown"
                              className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                              aria-label="Aqua"
                              value="aqua"
                            />
                          </li>
                        </ul>
                      </details>
                    </li>
                    <li>
                      <a>Item 2</a>
                    </li>
                  </ul>
                </details>
              </li>
              {isLoggedInConditionalRender}
            </ul>
          </div>
        </div>
      </div>
      <div className="drawer-side z-[1000]">
        <label
          htmlFor="my-drawer-3"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <ul className="flex flex-col menu bg-base-200 min-h-full w-50 p-4 ">
          {/* Sidebar content here */}

          <span className="menu-title ">About</span>

          <li className="">
            <a href="/" className="">
              Home
            </a>
          </li>
          <li className="">
            <a href="/" className="">
              Location
            </a>
          </li>
          <span className="menu-title">Users</span>
          <li>
            <details className="dropdown">
              <summary role="btn ">Notifications</summary>
              <ul className="menu dropdown-content bg-base-200 rounded-box z-[1] w-52 p-2 shadow">
                <li>
                  <a>Item 2</a>
                </li>
              </ul>
            </details>
          </li>

          <li>
            <details className="dropdown">
              <summary role="btn">Settings</summary>
              <ul className="menu dropdown-content bg-base-200 rounded-box z-[1] w-52 p-2 shadow">
                <li>
                  <details className="dropdown">
                    <summary role="btn">Themes</summary>
                    <ul className="menu dropdown-content bg-base-200 rounded-box z-[1] w-52 p-2 shadow">
                      <li>
                        <input
                          type="radio"
                          name="theme-dropdown"
                          className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                          aria-label="Forest (Default)"
                          value="forest"
                        />
                      </li>
                      <li>
                        <input
                          type="radio"
                          name="theme-dropdown"
                          className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                          aria-label="Retro"
                          value="retro"
                        />
                      </li>
                      <li>
                        <input
                          type="radio"
                          name="theme-dropdown"
                          className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                          aria-label="Cyberpunk"
                          value="cyberpunk"
                        />
                      </li>
                      <li>
                        <input
                          type="radio"
                          name="theme-dropdown"
                          className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                          aria-label="Valentine"
                          value="valentine"
                        />
                      </li>
                      <li>
                        <input
                          type="radio"
                          name="theme-dropdown"
                          className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                          aria-label="Aqua"
                          value="aqua"
                        />
                      </li>
                    </ul>
                  </details>
                </li>
                <li>
                  <a>Item 2</a>
                </li>
              </ul>
            </details>
          </li>
          <div className="flex flex-row mt-auto ">
            {isLoggedInConditionalRender}
          </div>
        </ul>
      </div>
    </div>
  );
};

export default Header;
