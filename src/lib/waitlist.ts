export const AVERAGE_WAIT_MINUTES = 10;

export const estimateWaitMinutes = (position: number) =>
  Math.max(position, 0) * AVERAGE_WAIT_MINUTES;

export const formatTimeAdded = (timestamp: string | Date | null | undefined) => {
  if (!timestamp) {
    return "Just now";
  }

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};
