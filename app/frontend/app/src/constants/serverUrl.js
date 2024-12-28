export const SERVER_URL = (ENDPOINT) =>{
    const baseUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : `http://${window.location.hostname}:5000`;  //import.meta.env.VITE_BACKEND_URL_TEST
    
    return `${baseUrl}/${ENDPOINT}`}; 