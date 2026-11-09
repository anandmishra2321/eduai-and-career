// ML Model Training Pipeline

import { Dataset, DataPoint, TrainingConfig, ModelMetrics, calculateMetrics } from "./dataset";

export interface TrainingProgress {
  epoch: number;
  totalEpochs: number;
  loss: number;
  accuracy: number;
  validationLoss?: number;
  validationAccuracy?: number;
}

export interface TrainedModel {
  id: string;
  name: string;
  datasetId: string;
  algorithm: string;
  metrics: ModelMetrics;
  config: TrainingConfig;
  createdAt: Date;
  weights: number[][];
  featureImportance: Record<string, number>;
}

export class TrainingPipeline {
  private progressCallback?: (progress: TrainingProgress) => void;
  private isTraining = false;
  private shouldStop = false;

  constructor(progressCallback?: (progress: TrainingProgress) => void) {
    this.progressCallback = progressCallback;
  }

  async trainModel(
    dataset: Dataset,
    config: TrainingConfig,
    algorithm: "neural-network" | "random-forest" | "gradient-boosting" | "logistic-regression" = "neural-network"
  ): Promise<TrainedModel> {
    this.isTraining = true;
    this.shouldStop = false;

    const { train, validation } = this.splitData(dataset, config.validationSplit);
    
    let weights = this.initializeWeights(dataset.features.length, this.getLabelCount(dataset));
    let bestWeights = weights;
    let bestAccuracy = 0;

    for (let epoch = 0; epoch < config.epochs; epoch++) {
      if (this.shouldStop) break;

      // Training phase
      const trainMetrics = this.trainEpoch(train, weights, config);
      
      // Validation phase
      const validationMetrics = this.evaluate(validation, weights);

      // Update weights (simplified gradient descent)
      weights = this.updateWeights(weights, trainMetrics.loss, config.learningRate);

      // Report progress
      this.progressCallback?.({
        epoch: epoch + 1,
        totalEpochs: config.epochs,
        loss: trainMetrics.loss,
        accuracy: trainMetrics.accuracy,
        validationLoss: validationMetrics.loss,
        validationAccuracy: validationMetrics.accuracy,
      });

      // Early stopping
      if (config.earlyStopping) {
        if (validationMetrics.accuracy > bestAccuracy) {
          bestAccuracy = validationMetrics.accuracy;
          bestWeights = JSON.parse(JSON.stringify(weights));
        } else if (epoch - this.getBestEpoch() >= config.patience) {
          break;
        }
      }

      // Simulate async training
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.isTraining = false;

    // Final evaluation
    const finalMetrics = this.evaluate(validation, bestWeights);

    return {
      id: `model-${Date.now()}`,
      name: `${dataset.name} - ${algorithm}`,
      datasetId: dataset.id,
      algorithm,
      metrics: finalMetrics,
      config,
      createdAt: new Date(),
      weights: bestWeights,
      featureImportance: this.calculateFeatureImportance(dataset, bestWeights),
    };
  }

  stop(): void {
    this.shouldStop = true;
  }

  private splitData(dataset: Dataset, validationSplit: number): {
    train: DataPoint[];
    validation: DataPoint[];
  } {
    const shuffled = [...dataset.data].sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor(dataset.size * (1 - validationSplit));
    return {
      train: shuffled.slice(0, splitIndex),
      validation: shuffled.slice(splitIndex),
    };
  }

  private initializeWeights(inputSize: number, outputSize: number): number[][] {
    const weights: number[][] = [];
    for (let i = 0; i < inputSize; i++) {
      weights[i] = [];
      for (let j = 0; j < outputSize; j++) {
        weights[i][j] = Math.random() * 2 - 1; // Random values between -1 and 1
      }
    }
    return weights;
  }

  private getLabelCount(dataset: Dataset): number {
    const labels = new Set(dataset.data.map(d => d.label));
    return labels.size;
  }

  private trainEpoch(data: DataPoint[], weights: number[][], config: TrainingConfig): {
    loss: number;
    accuracy: number;
  } {
    let totalLoss = 0;
    let correct = 0;

    for (let i = 0; i < data.length; i++) {
      const { prediction, loss } = this.forwardPass(data[i], weights);
      totalLoss += loss;
      
      if (prediction === data[i].label) {
        correct++;
      }
    }

    return {
      loss: totalLoss / data.length,
      accuracy: correct / data.length,
    };
  }

  private forwardPass(dataPoint: DataPoint, weights: number[][]): {
    prediction: string;
    loss: number;
  } {
    // Simplified forward pass for demonstration
    const featureValues = Object.values(dataPoint.features).map(v => Number(v) || 0);
    const scores = this.calculateScores(featureValues, weights);
    const prediction = this.getPrediction(scores);
    const loss = this.calculateLoss(prediction, dataPoint.label || "");

    return { prediction, loss };
  }

  private calculateScores(featureValues: number[], weights: number[][]): number[] {
    const scores: number[] = [];
    for (let j = 0; j < weights[0].length; j++) {
      let score = 0;
      for (let i = 0; i < featureValues.length; i++) {
        score += featureValues[i] * (weights[i]?.[j] || 0);
      }
      scores.push(score);
    }
    return scores;
  }

  private getPrediction(scores: number[]): string {
    const maxIndex = scores.indexOf(Math.max(...scores));
    return `class-${maxIndex}`;
  }

  private calculateLoss(prediction: string, actual: string): number {
    return prediction === actual ? 0 : 1;
  }

  private evaluate(data: DataPoint[], weights: number[][]): ModelMetrics {
    const predictions = data.map(d => this.forwardPass(d, weights).prediction);
    const actual = data.map(d => d.label || "");
    return calculateMetrics(predictions, actual);
  }

  private updateWeights(weights: number[][], loss: number, learningRate: number): number[][] {
    // Simplified weight update
    return weights.map(row =>
      row.map(weight => weight - learningRate * loss * 0.1)
    );
  }

  private getBestEpoch(): number {
    // Simplified - in real implementation would track best epoch
    return 0;
  }

  private calculateFeatureImportance(dataset: Dataset, weights: number[][]): Record<string, number> {
    const importance: Record<string, number> = {};
    dataset.features.forEach((feature, i) => {
      const weightSum = weights[i]?.reduce((a, b) => a + Math.abs(b), 0) || 0;
      importance[feature] = weightSum;
    });
    return importance;
  }
}

// Pre-trained models registry
export const TRAINED_MODELS: TrainedModel[] = [
  {
    id: "model-student-perf-001",
    name: "Student Performance Predictor",
    datasetId: "student-performance",
    algorithm: "neural-network",
    metrics: {
      accuracy: 0.87,
      precision: 0.85,
      recall: 0.83,
      f1Score: 0.84,
      loss: 0.13,
    },
    config: {
      epochs: 100,
      batchSize: 32,
      learningRate: 0.001,
      validationSplit: 0.2,
      earlyStopping: true,
      patience: 10,
    },
    createdAt: new Date("2024-01-15"),
    weights: [[0.5, -0.3, 0.8], [0.2, 0.6, -0.4], [-0.1, 0.7, 0.3]],
    featureImportance: {
      studyHours: 0.35,
      attendance: 0.28,
      assignments: 0.22,
      quizScores: 0.10,
      participation: 0.05,
    },
  },
  {
    id: "model-career-path-001",
    name: "Career Path Recommender",
    datasetId: "career-paths",
    algorithm: "random-forest",
    metrics: {
      accuracy: 0.92,
      precision: 0.90,
      recall: 0.88,
      f1Score: 0.89,
      loss: 0.08,
    },
    config: {
      epochs: 150,
      batchSize: 64,
      learningRate: 0.01,
      validationSplit: 0.15,
      earlyStopping: true,
      patience: 15,
    },
    createdAt: new Date("2024-02-01"),
    weights: [[0.4, 0.6, -0.2], [0.8, -0.3, 0.1], [-0.5, 0.4, 0.7]],
    featureImportance: {
      technicalSkills: 0.40,
      softSkills: 0.25,
      interests: 0.20,
      experience: 0.10,
      education: 0.05,
    },
  },
];

export function predictWithModel(model: TrainedModel, features: Record<string, number>): string {
  const featureValues = Object.values(features);
  const scores = model.weights.map((row, i) => 
    row.reduce((sum, weight, j) => sum + (featureValues[j] || 0) * weight, 0)
  );
  const maxIndex = scores.indexOf(Math.max(...scores));
  return `class-${maxIndex}`;
}
