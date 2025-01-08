const clearUserData = () => {
  localStorage.removeItem("user");
  sessionStorage.clear();
};
export default clearUserData;
