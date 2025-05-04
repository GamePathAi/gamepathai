
import { v4 as uuidv4 } from 'uuid';
import { KnowledgeEntry } from './types';

/**
 * Generates mock community knowledge entries for testing
 */
export class MockDataGenerator {
  /**
   * Generate mock community knowledge entries
   */
  public static generateMockEntries(): KnowledgeEntry[] {
    return [
      {
        id: uuidv4(),
        gameId: "cyberpunk2077",
        hardwareFingerprint: "nvidia-rtx3070-ryzen5600x-32gb",
        settingsConfig: {
          resolution: 0.75, // 1440p
          graphics_quality: 0.7,
          antialiasing: 0.5,
          shadows: 0.6,
          textures: 0.8,
          effects: 0.7,
          view_distance: 0.7,
          fps_cap: 0.6 // 60fps
        },
        performance: {
          fps: 78.5,
          frameTime: 12.7,
          stability: 0.92
        },
        timestamp: Date.now() - 1000000,
        upvotes: 42,
        downvotes: 3,
        tags: ["balanced", "ray-tracing", "verified"],
        verified: true
      },
      {
        id: uuidv4(),
        gameId: "fortnite",
        hardwareFingerprint: "nvidia-gtx1660-i5-10400-16gb",
        settingsConfig: {
          resolution: 0.5, // 1080p
          graphics_quality: 0.4,
          antialiasing: 0.3,
          shadows: 0.2,
          textures: 0.5,
          effects: 0.3,
          view_distance: 0.7,
          fps_cap: 1.0 // 240fps
        },
        performance: {
          fps: 165.2,
          frameTime: 6.1,
          stability: 0.85
        },
        timestamp: Date.now() - 500000,
        upvotes: 89,
        downvotes: 7,
        tags: ["competitive", "high-fps"],
        verified: true
      },
      {
        id: uuidv4(),
        gameId: "cyberpunk2077",
        hardwareFingerprint: "nvidia-rtx2060-i7-9700k-32gb",
        settingsConfig: {
          resolution: 0.5, // 1080p
          graphics_quality: 0.5,
          antialiasing: 0.4,
          shadows: 0.3,
          textures: 0.6,
          effects: 0.4,
          view_distance: 0.5,
          fps_cap: 0.6 // 60fps
        },
        performance: {
          fps: 62.3,
          frameTime: 16.1,
          stability: 0.88
        },
        timestamp: Date.now() - 2000000,
        upvotes: 27,
        downvotes: 5,
        tags: ["balanced"],
        verified: false
      }
    ];
  }
}
