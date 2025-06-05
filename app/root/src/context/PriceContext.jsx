import { createContext, useContext, useState } from "react";

const PriceContext = createContext({
  prices: {},
  loading: true,
  fetchPrices: () => {},
});
export default PriceContext;
