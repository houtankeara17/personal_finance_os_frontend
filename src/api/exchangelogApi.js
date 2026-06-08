import BASE_URL from "./config";

const BASE = `${BASE_URL}/api/exchangelog`;

export const exchangelogApi = {
  getAll: (headers) => fetch(BASE, { headers }).then((r) => r.json()),

  create: (payload, headers) =>
    fetch(BASE, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json()),

  update: (id, payload, headers) =>
    fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json()),

  remove: (id, headers) =>
    fetch(`${BASE}/${id}`, {
      method: "DELETE",
      headers,
    }).then((r) => r.json()),
};
