import BASE_URL from "./config";

const BASE = `${BASE_URL}/api/salaries`;

export const salaryApi = {
  getAll: (year, month, headers) =>
    fetch(`${BASE}?year=${year}&monthNumber=${month}`, { headers }).then((r) =>
      r.json(),
    ),

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
