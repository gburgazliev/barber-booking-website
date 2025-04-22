 import { SERVER_URL } from "../constants/serverUrl"
 
 export const cancelAppointment = async (id) => {
    const  response = await fetch(SERVER_URL(`api/appointments/cancel/:${id}`), {
        method: 'DELETE',
        credentials: 'include',
    
    });
    return response;
}
