/**
 * Refixion booking wizard state — persisted to localStorage.
 */
import { useEffect, useState } from "react";

const KEY = "refixion_booking_v1";

const defaultState = {
  step: 1,
  brand: null,
  device: null,
  repair: null,
  method: null,
  date: null,
  time: null,
  customer: {
    first_name: "", last_name: "", email: "", phone: "",
    street: "", house_number: "", postal_code: "", city: "",
    notes: "", consent: false,
  },
};

export function useBooking() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...defaultState, ...JSON.parse(raw) };
    } catch (e) {}
    return defaultState;
  });
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);
  const update = (patch) => setState((s) => ({ ...s, ...patch }));
  const reset = () => { localStorage.removeItem(KEY); setState(defaultState); };
  return { state, update, reset };
}
