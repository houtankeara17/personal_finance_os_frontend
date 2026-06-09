import BASE_URL from "./config";

const BASE = `${BASE_URL}/api/plans`;

export const plansApi = {
  /**
   * Fetch plans for a given year and month
   */
  fetchPlans: async (year, month, syncHeaders) => {
    const res = await fetch(`${BASE}?year=${year}&month=${month}`, {
      headers: syncHeaders(),
    });
    return await res.json();
  },

  /**
   * Create a new financial plan
   */
  createPlan: async (payload, syncHeaders) => {
    const res = await fetch(BASE, {
      method: "POST",
      headers: syncHeaders(),
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  /**
   * Update an existing financial plan
   */
  updatePlan: async (id, payload, syncHeaders) => {
    const res = await fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: syncHeaders(),
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  /**
   * Delete a financial plan
   */
  deletePlan: async (id, syncHeaders) => {
    const res = await fetch(`${BASE}/${id}`, {
      method: "DELETE",
      headers: syncHeaders(),
    });
    return await res.json();
  },
};
