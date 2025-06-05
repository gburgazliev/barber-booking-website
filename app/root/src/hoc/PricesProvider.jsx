import AlertContext from "../context/AlertContext"
import PriceContext from "../context/PriceContext";
import { useEffect, useState, useContext } from "react";
import { SERVER_URL } from "../constants/serverUrl";
import ALERT_TYPES from "../constants/alertTypeConstants";

const PricesProvider = ({ children }) => {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const { addAlert } = useContext(AlertContext);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const response = await fetch(SERVER_URL("api/prices"));
      if (!response.ok) {
        throw new Error("Failed to fetch prices");
      }
      const data = await response.json();
      const updatedData = data.reduce((acc, price) => {
        acc[price.type] = price.price;
        return acc;
      }, {});
      setPrices(updatedData);
    } catch (err) {
      addAlert(err.message, ALERT_TYPES.ERROR, "top", true, true, true, 3000);
      console.error("Error fetching prices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  if (loading) {
    return <span className="loading loading-spinner loading-sm"></span>; // You can replace this with a spinner or loading component
  }

  return (
    <PriceContext.Provider value={{ prices, loading, fetchPrices }}>
      {children}
    </PriceContext.Provider>
  );
};

export default PricesProvider;
