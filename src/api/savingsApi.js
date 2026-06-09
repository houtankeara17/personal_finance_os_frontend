import BASE_URL from "./config";

const BASE = `${BASE_URL}/api/savings`;

export const savingsApi = {
  fetchAll: async (headers) => {
    const res = await fetch(BASE, { headers });
    return res.json();
  },

  create: async (headers, payload) => {
    const res = await fetch(BASE, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  update: async (headers, id, payload) => {
    const res = await fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  remove: async (headers, id) => {
    const res = await fetch(`${BASE}/${id}`, {
      method: "DELETE",
      headers,
    });
    return res.json();
  },

  removeAll: async (headers) => {
    const res = await fetch(BASE, {
      method: "DELETE",
      headers,
    });
    return res.json();
  },
};
