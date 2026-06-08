import BASE_URL from "./config";

/**
 * Fetch expenses + calendar data for a given month.
 * Returns { expenses, stats, calendarMap }
 */
export async function fetchExpensesMonth(year, monthNumber, headers) {
  const [expRes, calRes] = await Promise.all([
    fetch(
      `${BASE_URL}/api/expenses?year=${year}&monthNumber=${monthNumber}&limit=200`,
      { headers },
    ).then((r) => r.json()),
    fetch(
      `${BASE_URL}/api/expenses/analytics/calendar?year=${year}&monthNumber=${monthNumber}`,
      { headers },
    ).then((r) => r.json()),
  ]);

  const expenses = expRes.success ? expRes.data || [] : [];
  const stats = expRes.success ? expRes.stats || null : null;

  const calendarMap = {};
  if (calRes.success) {
    (calRes.data || []).forEach((d) => {
      calendarMap[d.day] = d;
    });
  }

  return { expenses, stats, calendarMap };
}

/** Create a new expense. Returns the parsed API response. */
export async function createExpense(data, headers) {
  return fetch(`${BASE_URL}/api/expenses`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => r.json());
}

/** Update an existing expense by id. Returns the parsed API response. */
export async function updateExpense(id, data, headers) {
  return fetch(`${BASE_URL}/api/expenses/${id}`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => r.json());
}

/** Delete a single expense by id. */
export async function deleteExpense(id, headers) {
  return fetch(`${BASE_URL}/api/expenses/${id}`, {
    method: "DELETE",
    headers,
  });
}
