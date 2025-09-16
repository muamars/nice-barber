// Push rows to Google Sheets using a service account.
// Requires these env vars on server: GOOGLE_SERVICE_ACCOUNT_KEY (JSON string), GOOGLE_SHEET_ID
// The service account must have edit access to the sheet (share the sheet with the service account email).

export const pushRowsToSheet = async (rows: unknown[]) => {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_KEY env var");
  }
  if (!process.env.GOOGLE_SHEET_ID) {
    throw new Error("Missing GOOGLE_SHEET_ID env var");
  }

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

  // dynamic import to avoid static type resolution issues in some environments
  const { google } = await import("googleapis");
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const client = await auth.getClient();
  // use `any` to avoid TypeScript overload issues with the googleapis types in this workspace
  // @ts-expect-error - dynamic googleapis types can cause overload mismatch in this workspace
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sheets: any = google.sheets({ version: "v4", auth: client });

  const values = Array.isArray(rows) ? rows : [];

  // Append to first sheet; change range if you want a named range or a specific sheet.
  const range = "Sheet1!A:F";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resp: any = await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });

  return resp.data;
};

// Get existing data from Google Sheets to check for duplicates
export const getSheetData = async (range = "Sheet1!A:F") => {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_KEY env var");
  }
  if (!process.env.GOOGLE_SHEET_ID) {
    throw new Error("Missing GOOGLE_SHEET_ID env var");
  }

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

  // dynamic import to avoid static type resolution issues in some environments
  const { google } = await import("googleapis");
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const client = await auth.getClient();
  // @ts-expect-error - dynamic googleapis types can cause overload mismatch in this workspace
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sheets: any = google.sheets({ version: "v4", auth: client });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resp: any = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range,
    });

    return resp.data.values || [];
  } catch {
    // If sheet is empty or doesn't exist, return empty array
    return [];
  }
};

// Clear all data from sheet (for testing purposes)
export const clearSheet = async (range = "Sheet1!A:F") => {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_KEY env var");
  }
  if (!process.env.GOOGLE_SHEET_ID) {
    throw new Error("Missing GOOGLE_SHEET_ID env var");
  }

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

  const { google } = await import("googleapis");
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const client = await auth.getClient();
  // @ts-expect-error - dynamic googleapis types can cause overload mismatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sheets: any = google.sheets({ version: "v4", auth: client });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resp: any = await sheets.spreadsheets.values.clear({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range,
  });

  return resp.data;
};
