import { SERVER_URL } from "../constants/serverUrl";

export const newPasswordRequest = async (resetToken, newPassword) => {
  const response = await fetch(SERVER_URL("api/users/new-password"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resetToken, newPassword }),
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${body.message}`);
  }

  return body;
};
