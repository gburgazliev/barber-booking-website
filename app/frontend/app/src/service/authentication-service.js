import { SERVER_URL } from "../constants/serverUrl";

export const login = async (email, password) => {
  try {
    const response = await fetch(SERVER_URL("api/users/login"), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
    if (!response.ok) {
      throw new Error(
        "Make sure you are passing valid email and password."
      );
    }
    const body = await response.json();
    return body.user;
  } catch (error) {
    console.error(error.message);
    throw error;
  }
};

export const register = async (firstname, lastname, email, password) => {
  try {
    const response = await fetch(SERVER_URL("api/users/register"), {
      method: "POST",
      credentials: "include",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstname,
        lastname,
        email,
        password,
      }),
    });

    if (!response.ok) {
      const errorMessage = await response.json();
      throw new Error(errorMessage.message);
    }
    return await response.json();
  } catch (error) {
    console.error(error.message);
    throw error;
  }
};

export const validateFirstnameAndLastname = (firstname, lastname) => {
  if (firstname.length < 3 || lastname.length < 3) {
    throw new Error("First and last name should be atleast 3 characters long!");
  }
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email!");
  }
};
