
export * from "./types";
export * from "./utils";
export * from "./featureExtraction";
export * from "./modelManager";
export * from "./predictionEngine";

import { predictionEngine } from "./predictionEngine";

// Re-export the prediction engine as neuralPredictionEngine for backward compatibility
export const neuralPredictionEngine = predictionEngine;
