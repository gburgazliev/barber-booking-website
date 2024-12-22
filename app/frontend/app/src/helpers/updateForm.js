const updateForm = (key, value, setForm) => {
    setForm((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };
  export default updateForm;