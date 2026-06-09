import BASE_URL from "./config";

const BASE = `${BASE_URL}/api/salaries`;

export const salaryApi = {
  // Expected layout inside your salaryApi.js file
  getAll: async (year, headers) => {
    const response = await fetch(`${BASE}?year=${year}`, {
      method: "GET",
      headers: headers, // Ensure this isn't blank!
    });
    return response.json();
  },

  create: (payload, headers) =>
    fetch(BASE, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }).then((r) => r.json()),

  update: (id, payload, headers) =>
    fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    }).then((r) => r.json()),

  remove: (id, headers) =>
    fetch(`${BASE}/${id}`, {
      method: "DELETE",
      headers,
    }).then((r) => r.json()),
};
