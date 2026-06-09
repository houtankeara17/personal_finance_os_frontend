import BASE_URL from "./config";

const BASE = `${BASE_URL}/api/bonuses`;
const SALARY_BASE = `${BASE_URL}/api/salaries`;

export const bonusApi = {
  getAll: (headers) => fetch(BASE, { headers }).then((r) => r.json()),

  // Ensure your API function looks like this:
  getSalaryForMonth: (year, monthNumber, headers) =>
    fetch(`${BASE_URL}/api/salaries?year=${year}&monthNumber=${monthNumber}`, {
      headers,
    }).then((r) => r.json()),

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
