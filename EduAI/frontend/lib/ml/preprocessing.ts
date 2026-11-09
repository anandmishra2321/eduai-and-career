// Data Preprocessing Utilities

import { DataPoint } from "./dataset";

export interface PreprocessingConfig {
  normalize?: boolean;
  handleMissing?: "drop" | "mean" | "median" | "mode";
  encodeCategorical?: boolean;
  removeOutliers?: boolean;
  outlierMethod?: "iqr" | "zscore";
}

export interface PreprocessedData {
  data: DataPoint[];
  statistics: Record<string, { mean: number; std: number; min: number; max: number }>;
  transformations: Record<string, string>;
}

export function preprocessData(
  data: DataPoint[],
  features: string[],
  config: PreprocessingConfig = {}
): PreprocessedData {
  let processedData = [...data];
  const transformations: Record<string, string> = {};
  const statistics: Record<string, any> = {};

  // Handle missing values
  if (config.handleMissing) {
    processedData = handleMissingValues(processedData, features, config.handleMissing);
    transformations["missing"] = config.handleMissing;
  }

  // Calculate statistics before normalization
  features.forEach(feature => {
    const values = processedData.map(d => Number(d.features[feature]) || 0);
    statistics[feature] = {
      mean: values.reduce((a, b) => a + b, 0) / values.length,
      std: Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - values.reduce((a, b) => a + b, 0) / values.length, 2), 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
    };
  });

  // Remove outliers
  if (config.removeOutliers) {
    processedData = removeOutliersFromData(processedData, features, config.outlierMethod || "iqr");
    transformations["outliers"] = config.outlierMethod || "iqr";
  }

  // Normalize features
  if (config.normalize) {
    processedData = normalizeFeatures(processedData, features, statistics);
    transformations["normalization"] = "minmax";
  }

  // Encode categorical features
  if (config.encodeCategorical) {
    processedData = encodeCategoricalFeatures(processedData, features);
    transformations["encoding"] = "one-hot";
  }

  return {
    data: processedData,
    statistics,
    transformations,
  };
}

function handleMissingValues(
  data: DataPoint[],
  features: string[],
  method: "drop" | "mean" | "median" | "mode"
): DataPoint[] {
  if (method === "drop") {
    return data.filter(point =>
      features.every(feature => point.features[feature] !== undefined && point.features[feature] !== null)
    );
  }

  const fillValues: Record<string, number> = {};

  features.forEach(feature => {
    const values = data
      .map(d => d.features[feature])
      .filter(v => v !== undefined && v !== null)
      .map(v => Number(v));

    if (method === "mean") {
      fillValues[feature] = values.reduce((a, b) => a + b, 0) / values.length;
    } else if (method === "median") {
      const sorted = [...values].sort((a, b) => a - b);
      fillValues[feature] = sorted[Math.floor(sorted.length / 2)];
    } else if (method === "mode") {
      const frequency: Record<number, number> = {};
      values.forEach(v => frequency[v] = (frequency[v] || 0) + 1);
      fillValues[feature] = Number(Object.entries(frequency).sort((a, b) => b[1] - a[1])[0][0]);
    }
  });

  return data.map(point => ({
    ...point,
    features: Object.fromEntries(
      features.map(feature => [
        feature,
        point.features[feature] !== undefined && point.features[feature] !== null
          ? point.features[feature]
          : fillValues[feature],
      ])
    ),
  }));
}

function removeOutliersFromData(
  data: DataPoint[],
  features: string[],
  method: "iqr" | "zscore"
): DataPoint[] {
  const outliers = new Set<string>();

  features.forEach(feature => {
    const values = data.map(d => Number(d.features[feature]) || 0);
    
    if (method === "iqr") {
      const sorted = [...values].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      data.forEach((point, index) => {
        const value = Number(point.features[feature]) || 0;
        if (value < lowerBound || value > upperBound) {
          outliers.add(point.id);
        }
      });
    } else if (method === "zscore") {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

      data.forEach((point, index) => {
        const value = Number(point.features[feature]) || 0;
        const zscore = Math.abs((value - mean) / std);
        if (zscore > 3) {
          outliers.add(point.id);
        }
      });
    }
  });

  return data.filter(point => !outliers.has(point.id));
}

function normalizeFeatures(
  data: DataPoint[],
  features: string[],
  statistics: Record<string, any>
): DataPoint[] {
  return data.map(point => ({
    ...point,
    features: Object.fromEntries(
      features.map(feature => {
        const value = Number(point.features[feature]) || 0;
        const stats = statistics[feature];
        const normalized = stats.max !== stats.min
          ? (value - stats.min) / (stats.max - stats.min)
          : 0;
        return [feature, normalized];
      })
    ),
  }));
}

function encodeCategoricalFeatures(data: DataPoint[], features: string[]): DataPoint[] {
  const encodings: Record<string, Record<string, number>> = {};

  features.forEach(feature => {
    const uniqueValues = new Set(data.map(d => String(d.features[feature])));
    let index = 0;
    encodings[feature] = {};
    uniqueValues.forEach(value => {
      encodings[feature][value] = index++;
    });
  });

  return data.map(point => ({
    ...point,
    features: Object.fromEntries(
      features.map(feature => [
        feature,
        encodings[feature][String(point.features[feature])] || 0,
      ])
    ),
  }));
}

export function featureSelection(
  data: DataPoint[],
  features: string[],
  method: "correlation" | "variance" | "mutual-info" = "correlation",
  topK?: number
): string[] {
  if (method === "variance") {
    const variances = features.map(feature => {
      const values = data.map(d => Number(d.features[feature]) || 0);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      return { feature, variance };
    });

    const sorted = variances.sort((a, b) => b.variance - a.variance);
    return topK ? sorted.slice(0, topK).map(s => s.feature) : sorted.map(s => s.feature);
  }

  if (method === "correlation") {
    // Simplified correlation-based selection
    return features.slice(0, topK || features.length);
  }

  return features;
}

export function augmentData(data: DataPoint[], factor: number = 2): DataPoint[] {
  const augmented = [...data];

  for (let i = 0; i < factor - 1; i++) {
    data.forEach(point => {
      const noise = Object.fromEntries(
        Object.entries(point.features).map(([key, value]) => [
          key,
          typeof value === "number" ? value + (Math.random() - 0.5) * 0.1 * value : value,
        ])
      );

      augmented.push({
        ...point,
        id: `${point.id}-aug-${i}`,
        features: noise,
        timestamp: new Date(),
      });
    });
  }

  return augmented;
}
