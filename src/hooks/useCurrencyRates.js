import { useState, useEffect, useCallback } from "react";

// Fetches live rates from open.er-api.com (free, no key needed)
// Base is always USD; we convert from USD → target currency
const RATES_URL = "https://open.er-api.com/v6/latest/USD";

export function useCurrencyRates(targetCurrency = "USD") {
  const [rates, setRates] = useState(null); // { KHR: 4100, THB: 35.5, USD: 1, ... }
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchRates = useCallback(async () => {
    setRatesLoading(true);
    setRatesError(null);
    try {
      const res = await fetch(RATES_URL);
      if (!res.ok) throw new Error(`Rates fetch failed: ${res.status}`);
      const json = await res.json();
      if (json.result !== "success") throw new Error("Rates API error");
      setRates(json.rates); // { USD: 1, KHR: 4100, THB: 35.5, EUR: 0.92, ... }
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Currency rates error:", err);
      setRatesError(err.message);
      // Fallback rates (approximate) so the UI never breaks
      setRates({ USD: 1, KHR: 4100, THB: 35.5, EUR: 0.92, GBP: 0.79 });
    } finally {
      setRatesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    // Refresh rates every 30 minutes
    const interval = setInterval(fetchRates, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  /**
   * Convert a USD amount to targetCurrency using live rates.
   * @param {number} usdAmount
   * @param {string} [overrideCurrency] — use a specific currency instead of targetCurrency
   */
  const convert = useCallback(
    (usdAmount, overrideCurrency) => {
      const cur = overrideCurrency || targetCurrency;
      if (!rates || cur === "USD") return usdAmount;
      const rate = rates[cur];
      if (!rate) return usdAmount; // unknown currency → return as-is
      return usdAmount * rate;
    },
    [rates, targetCurrency],
  );

  /**
   * Format a USD amount, converting to targetCurrency first.
   */
  const fmtConverted = useCallback(
    (usdAmount, overrideCurrency) => {
      const cur = overrideCurrency || targetCurrency;
      if (usdAmount == null || isNaN(Number(usdAmount))) {
        return formatCurrency(0, cur);
      }
      const converted = convert(Number(usdAmount), cur);
      return formatCurrency(converted, cur);
    },
    [convert, targetCurrency],
  );

  return {
    rates,
    ratesLoading,
    ratesError,
    lastUpdated,
    convert,
    fmtConverted,
    refetch: fetchRates,
  };
}

/**
 * Format a number in a given currency.
 * Falls back gracefully for currencies Intl might not know.
 */
export function formatCurrency(val, currency = "USD") {
  if (val == null || isNaN(Number(val))) return "0.00";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "KHR" || currency === "JPY" ? 0 : 2,
    }).format(val);
  } catch {
    // Intl doesn't know this currency code
    return `${currency} ${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  }
}

/**
 * Get a human-readable rate label, e.g. "1 USD = 4,100 KHR"
 */
export function getRateLabel(rates, from = "USD", to = "USD") {
  if (!rates || from === to) return null;
  const rate = rates[to];
  if (!rate) return null;
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: to === "KHR" || to === "JPY" ? 0 : 4,
  }).format(rate);
  return `1 ${from} = ${formatted} ${to}`;
}
