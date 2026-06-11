import BASE_URL from "./config";
const BASE = `${BASE_URL}/api/plans`;

export const plansApi = {
  /**
   * Fetch ALL plans for the user (backend does not filter by date)
   */
  fetchPlans: async (syncHeaders) => {
    const res = await fetch(BASE, {
      headers: syncHeaders(),
    });
    return await res.json();
  },
  createPlan: async (payload, syncHeaders) => {
    const res = await fetch(BASE, {
      method: "POST",
      headers: syncHeaders(),
      body: JSON.stringify(payload),
    });
    return await res.json();
  },
  updatePlan: async (id, payload, syncHeaders) => {
    const res = await fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: syncHeaders(),
      body: JSON.stringify(payload),
    });
    return await res.json();
  },
  deletePlan: async (id, syncHeaders) => {
    const res = await fetch(`${BASE}/${id}`, {
      method: "DELETE",
      headers: syncHeaders(),
    });
    return await res.json();
  },
};
