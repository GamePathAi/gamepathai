
/**
 * Utility functions for hardware monitoring components
 */
export const formatTemperature = (temp?: number, t?: (key: string) => string): string => {
  const notAvailable = t ? t("hardware.notAvailable") : "N/A";
  if (temp === undefined) return notAvailable;
  return `${temp.toFixed(1)}°C`;
};

export const formatMemory = (bytes?: number, t?: (key: string) => string): string => {
  const notAvailable = t ? t("hardware.notAvailable") : "N/A";
  if (bytes === undefined) return notAvailable;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};
