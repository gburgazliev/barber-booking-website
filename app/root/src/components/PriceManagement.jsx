import React, { useState, useEffect, useContext } from "react";
import { SERVER_URL } from "../constants/serverUrl";
import AlertContext from "../context/AlertContext";
import PriceContext from "../context/PriceContext";
import ALERT_TYPES from "../constants/alertTypeConstants";
import { ScissorsIcon, BeardIcon, RazorIcon } from "./BarberIcons";

const PriceManagement = () => {
  const [prices, setPrices] = useState({
    Hair: 0,
    Beard: 0,
    "Hair and Beard": 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [editingPrice, setEditingPrice] = useState(null);
  const [tempPrice, setTempPrice] = useState("");
  
  const { addAlert } = useContext(AlertContext);
  const { fetchPrices } = useContext(PriceContext);

  const serviceIcons = {
    Hair: <ScissorsIcon size={32} />,
    Beard: <BeardIcon size={32} />,
    "Hair and Beard": <RazorIcon size={32} />,
  };

  const serviceDescriptions = {
    Hair: "Professional haircut tailored to your style preferences",
    Beard: "Expert beard trimming, shaping, and styling",
    "Hair and Beard": "Complete package including haircut and beard grooming",
  };

  // Fetch current prices
  const fetchCurrentPrices = async () => {
    try {
      setLoading(true);
      const response = await fetch(SERVER_URL("api/prices/"));
      
      if (response.ok) {
        const data = await response.json();
        const pricesObj = data.reduce((acc, price) => {
          acc[price.type] = price.price;
          return acc;
        }, {
          Hair: 0,
          Beard: 0,
          "Hair and Beard": 0,
        });
        setPrices(pricesObj);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch prices");
      }
    } catch (error) {
      addAlert(`Error loading prices: ${error.message}`, ALERT_TYPES.ERROR);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentPrices();
  }, []);

  // Handle price update
  const handleUpdatePrice = async (serviceType, newPrice) => {
    try {
      setSaving(prev => ({ ...prev, [serviceType]: true }));
      
      const response = await fetch(SERVER_URL("api/prices/set-price"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: serviceType,
          price: parseFloat(newPrice),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state
        setPrices(prev => ({
          ...prev,
          [serviceType]: parseFloat(newPrice),
        }));
        
        // Refresh the global price context
        await fetchPrices();
        
        addAlert(data.message, ALERT_TYPES.SUCCESS);
        setEditingPrice(null);
        setTempPrice("");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update price");
      }
    } catch (error) {
      addAlert(`Error updating price: ${error.message}`, ALERT_TYPES.ERROR);
    } finally {
      setSaving(prev => ({ ...prev, [serviceType]: false }));
    }
  };

  // Handle edit start
  const handleStartEdit = (serviceType) => {
    setEditingPrice(serviceType);
    setTempPrice(prices[serviceType].toString());
  };

  // Handle edit cancel
  const handleCancelEdit = () => {
    setEditingPrice(null);
    setTempPrice("");
  };

  // Handle edit save
  const handleSaveEdit = () => {
    if (tempPrice && !isNaN(tempPrice) && parseFloat(tempPrice) >= 0) {
      handleUpdatePrice(editingPrice, tempPrice);
    } else {
      addAlert("Please enter a valid price", ALERT_TYPES.ERROR);
    }
  };

  // Handle key press in input
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <span className="loading loading-spinner loading-lg"></span>
        <span className="ml-2">Loading prices...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Price Management</h1>
        <button
          className="btn btn-primary"
          onClick={fetchCurrentPrices}
          disabled={loading}
        >
          {loading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            "Refresh Prices"
          )}
        </button>
      </div>

      {/* Price Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Object.entries(prices).map(([serviceType, price]) => (
          <div
            key={serviceType}
            className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <div className="card-body">
              <div className="flex items-center justify-center mb-4 text-primary">
                {serviceIcons[serviceType]}
              </div>
              
              <h2 className="card-title justify-center text-xl mb-2">
                {serviceType}
              </h2>
              
              <p className="text-center text-sm opacity-70 mb-4">
                {serviceDescriptions[serviceType]}
              </p>

              {/* Price Display/Edit */}
              <div className="flex items-center justify-center mb-4">
                {editingPrice === serviceType ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={tempPrice}
                      onChange={(e) => setTempPrice(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="input input-bordered input-sm w-20 text-center"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      autoFocus
                    />
                    <span className="text-lg font-semibold">lv</span>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-primary">
                    {price} lv
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="card-actions justify-center">
                {editingPrice === serviceType ? (
                  <div className="flex gap-2">
                    <button
                      className={`btn btn-success btn-sm ${
                        saving[serviceType] ? "loading" : ""
                      }`}
                      onClick={handleSaveEdit}
                      disabled={saving[serviceType]}
                    >
                      {saving[serviceType] ? "" : "Save"}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={handleCancelEdit}
                      disabled={saving[serviceType]}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleStartEdit(serviceType)}
                    disabled={Object.values(saving).some(Boolean)}
                  >
                    Edit Price
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Update Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">Bulk Price Updates</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Presets */}
            <div>
              <h3 className="font-semibold mb-3">Quick Presets</h3>
              <div className="space-y-2">
                <button
                  className="btn btn-outline btn-sm w-full"
                  onClick={() => {
                    const newPrices = { Hair: 25, Beard: 25, "Hair and Beard": 40 };
                    Object.entries(newPrices).forEach(([type, price]) => {
                      handleUpdatePrice(type, price);
                    });
                  }}
                  disabled={Object.values(saving).some(Boolean)}
                >
                  Standard Pricing (25/25/40 lv)
                </button>
                
                <button
                  className="btn btn-outline btn-sm w-full"
                  onClick={() => {
                    const newPrices = { Hair: 30, Beard: 30, "Hair and Beard": 50 };
                    Object.entries(newPrices).forEach(([type, price]) => {
                      handleUpdatePrice(type, price);
                    });
                  }}
                  disabled={Object.values(saving).some(Boolean)}
                >
                  Premium Pricing (30/30/50 lv)
                </button>
              </div>
            </div>

            {/* Percentage Adjustments */}
            <div>
              <h3 className="font-semibold mb-3">Percentage Adjustments</h3>
              <div className="flex gap-2">
                <button
                  className="btn btn-outline btn-sm flex-1"
                  onClick={() => {
                    Object.entries(prices).forEach(([type, currentPrice]) => {
                      const newPrice = Math.round(currentPrice * 1.1 * 100) / 100;
                      handleUpdatePrice(type, newPrice);
                    });
                  }}
                  disabled={Object.values(saving).some(Boolean)}
                >
                  +10%
                </button>
                
                <button
                  className="btn btn-outline btn-sm flex-1"
                  onClick={() => {
                    Object.entries(prices).forEach(([type, currentPrice]) => {
                      const newPrice = Math.round(currentPrice * 0.9 * 100) / 100;
                      handleUpdatePrice(type, newPrice);
                    });
                  }}
                  disabled={Object.values(saving).some(Boolean)}
                >
                  -10%
                </button>
              </div>
            </div>
          </div>

          <div className="alert alert-info mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>
              Price changes will immediately affect new bookings. Existing appointments will keep their original pricing.
            </span>
          </div>
        </div>
      </div>

      {/* Price History (Future Enhancement) */}
      <div className="card bg-base-100 shadow-xl mt-8">
        <div className="card-body">
          <h2 className="card-title mb-4">Recent Price Changes</h2>
          <div className="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>Price history tracking will be available in a future update.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceManagement;