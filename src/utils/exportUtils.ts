/**
 * Utility functions for exporting data as JSON, CSV, or TXT files.
 */

/**
 * Trigger a browser download for JSON data.
 */
export function downloadAsJson(data: any, filename: string = "export.json"): void {
  try {
    const jsonStr = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
    triggerDownload(blob, filename.endsWith(".json") ? filename : `${filename}.json`);
  } catch (err) {
    console.error("Failed to export as JSON:", err);
  }
}

/**
 * Trigger a browser download for CSV data.
 * Accepts an array of object records or a raw CSV string.
 */
export function downloadAsCsv(
  data: Array<Record<string, any>> | string,
  filename: string = "export.csv"
): void {
  try {
    let csvContent = "";

    if (typeof data === "string") {
      csvContent = data;
    } else if (Array.isArray(data) && data.length > 0) {
      // Extract headers
      const headers = Object.keys(data[0]);
      csvContent += headers.join(",") + "\n";

      // Extract rows
      data.forEach((row) => {
        const values = headers.map((header) => {
          const val = row[header] ?? "";
          const str = typeof val === "object" ? JSON.stringify(val) : String(val);
          // Escape quotes
          return `"${str.replace(/"/g, '""')}"`;
        });
        csvContent += values.join(",") + "\n";
      });
    } else {
      csvContent = "No data available";
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
  } catch (err) {
    console.error("Failed to export as CSV:", err);
  }
}

/**
 * Trigger a browser download for plain text data.
 */
export function downloadAsTxt(text: string, filename: string = "export.txt"): void {
  try {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
    triggerDownload(blob, filename.endsWith(".txt") ? filename : `${filename}.txt`);
  } catch (err) {
    console.error("Failed to export as TXT:", err);
  }
}

/**
 * Internal helper to trigger a browser file save download link.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
