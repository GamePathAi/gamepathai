
import { HardwareData } from "@/types/metrics";

/**
 * Get a display name for a game based on its ID
 */
export function getGameDisplayName(gameId: string): string {
  // This would ideally look up a proper game name from a game service
  // For now, just convert the ID to a nicer format
  const gameNames: Record<string, string> = {
    "cyberpunk2077": "Cyberpunk 2077",
    "valorant": "Valorant",
    "fortnite": "Fortnite",
    "csgo2": "CS2",
    "gta5": "Grand Theft Auto V"
  };
  
  return gameNames[gameId] || gameId.charAt(0).toUpperCase() + gameId.slice(1);
}

/**
 * Generate a hardware fingerprint from hardware data
 */
export function generateHardwareFingerprint(hardwareData: HardwareData): string {
  // In a real implementation, this would extract GPU model, CPU model, etc.
  // For now, we'll use a simplified version
  return `cpu-${Math.round(hardwareData.cpu.usage)}-gpu-${hardwareData.gpu?.usage || 0}-mem-${hardwareData.memory.total}`;
}
