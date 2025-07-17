// client/src/lib/helpers/date.ts
export const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);

  // Get UTC components to ensure consistency
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const seconds = date.getUTCSeconds().toString().padStart(2, "0");

  // Format as DD/MM/YYYY, HH.MM.SS
  return `${day}/${month}/${year}, ${hours}.${minutes}.${seconds}`;
};
