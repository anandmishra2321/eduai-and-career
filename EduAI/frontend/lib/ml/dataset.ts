// Training Dataset Management System

export interface DataPoint {
  id: string;
  features: Record<string, number | string | boolean>;
  label?: string;
  timestamp: Date;
  source: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  data: DataPoint[];
  size: number;
  features: string[];
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
  status: "training" | "validation" | "test" | "production";
}

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
  earlyStopping: boolean;
  patience: number;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  loss: number;
  confusionMatrix?: number[][];
}

// Sample training datasets
export const SAMPLE_DATASETS: Dataset[] = [
  {
    id: "student-performance",
    name: "Student Performance Dataset",
    description: "Academic performance data with study habits and outcomes",
    data: generateStudentData(1000),
    size: 1000,
    features: ["studyHours", "attendance", "assignments", "quizScores", "participation"],
    labels: ["grade"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date(),
    status: "training",
  },
  {
    id: "career-paths",
    name: "Career Path Recommendations",
    description: "Skills and interests mapped to career recommendations",
    data: generateCareerData(500),
    size: 500,
    features: ["technicalSkills", "softSkills", "interests", "experience", "education"],
    labels: ["careerPath"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date(),
    status: "training",
  },
  {
    id: "learning-patterns",
    name: "Learning Patterns Dataset",
    description: "User learning behavior and engagement patterns",
    data: generateLearningData(750),
    size: 750,
    features: ["sessionDuration", "completionRate", "retryCount", "timeOfDay", "deviceType"],
    labels: ["learningStyle"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date(),
    status: "validation",
  },
];

// Data generation functions
function generateStudentData(count: number): DataPoint[] {
  const data: DataPoint[] = [];
  for (let i = 0; i < count; i++) {
    const studyHours = Math.random() * 10 + 1;
    const attendance = Math.random() * 100;
    const assignments = Math.floor(Math.random() * 100);
    const quizScores = Math.random() * 100;
    const participation = Math.random() * 10;
    
    let grade = "F";
    const weightedScore = (studyHours * 0.3) + (attendance * 0.2) + (assignments * 0.25) + (quizScores * 0.2) + (participation * 0.05);
    
    if (weightedScore >= 90) grade = "A";
    else if (weightedScore >= 80) grade = "B";
    else if (weightedScore >= 70) grade = "C";
    else if (weightedScore >= 60) grade = "D";
    
    data.push({
      id: `student-${i}`,
      features: { studyHours, attendance, assignments, quizScores, participation },
      label: grade,
      timestamp: new Date(),
      source: "lms",
    });
  }
  return data;
}

function generateCareerData(count: number): DataPoint[] {
  const careers = ["Software Engineer", "Data Scientist", "Product Manager", "UX Designer", "DevOps Engineer"];
  const data: DataPoint[] = [];
  
  for (let i = 0; i < count; i++) {
    const careerIndex = Math.floor(Math.random() * careers.length);
    data.push({
      id: `career-${i}`,
      features: {
        technicalSkills: Math.random() * 100,
        softSkills: Math.random() * 100,
        interests: Math.random() * 100,
        experience: Math.floor(Math.random() * 10),
        education: Math.floor(Math.random() * 4),
      },
      label: careers[careerIndex],
      timestamp: new Date(),
      source: "career-assessment",
    });
  }
  return data;
}

function generateLearningData(count: number): DataPoint[] {
  const styles = ["Visual", "Auditory", "Kinesthetic", "Reading/Writing"];
  const data: DataPoint[] = [];
  
  for (let i = 0; i < count; i++) {
    const styleIndex = Math.floor(Math.random() * styles.length);
    data.push({
      id: `learning-${i}`,
      features: {
        sessionDuration: Math.random() * 120 + 10,
        completionRate: Math.random() * 100,
        retryCount: Math.floor(Math.random() * 5),
        timeOfDay: Math.floor(Math.random() * 24),
        deviceType: Math.floor(Math.random() * 3),
      },
      label: styles[styleIndex],
      timestamp: new Date(),
      source: "analytics",
    });
  }
  return data;
}

// Dataset operations
export function splitDataset(dataset: Dataset, trainRatio: number = 0.7, valRatio: number = 0.15): {
  train: Dataset;
  validation: Dataset;
  test: Dataset;
} {
  const shuffled = [...dataset.data].sort(() => Math.random() - 0.5);
  const trainSize = Math.floor(dataset.size * trainRatio);
  const valSize = Math.floor(dataset.size * valRatio);
  
  return {
    train: {
      ...dataset,
      id: `${dataset.id}-train`,
      status: "training",
      data: shuffled.slice(0, trainSize),
      size: trainSize,
    },
    validation: {
      ...dataset,
      id: `${dataset.id}-validation`,
      status: "validation",
      data: shuffled.slice(trainSize, trainSize + valSize),
      size: valSize,
    },
    test: {
      ...dataset,
      id: `${dataset.id}-test`,
      status: "test",
      data: shuffled.slice(trainSize + valSize),
      size: dataset.size - trainSize - valSize,
    },
  };
}

export function normalizeFeatures(data: DataPoint[], features: string[]): DataPoint[] {
  const featureStats: Record<string, { min: number; max: number; mean: number }> = {};
  
  // Calculate statistics
  features.forEach(feature => {
    const values = data.map(d => d.features[feature] as number);
    featureStats[feature] = {
      min: Math.min(...values),
      max: Math.max(...values),
      mean: values.reduce((a, b) => a + b, 0) / values.length,
    };
  });
  
  // Normalize
  return data.map(point => ({
    ...point,
    features: Object.fromEntries(
      features.map(feature => {
        const value = point.features[feature] as number;
        const stats = featureStats[feature];
        return [feature, (value - stats.min) / (stats.max - stats.min)];
      })
    ),
  }));
}

export function calculateMetrics(predictions: string[], actual: string[]): ModelMetrics {
  const correct = predictions.filter((p, i) => p === actual[i]).length;
  const accuracy = correct / predictions.length;
  
  // Calculate precision, recall, F1 for each class
  const classes = [...new Set([...predictions, ...actual])];
  let totalPrecision = 0;
  let totalRecall = 0;
  
  classes.forEach(cls => {
    const truePositives = predictions.filter((p, i) => p === cls && actual[i] === cls).length;
    const falsePositives = predictions.filter((p, i) => p === cls && actual[i] !== cls).length;
    const falseNegatives = predictions.filter((p, i) => p !== cls && actual[i] === cls).length;
    
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    
    totalPrecision += precision;
    totalRecall += recall;
  });
  
  const avgPrecision = totalPrecision / classes.length;
  const avgRecall = totalRecall / classes.length;
  const f1Score = 2 * ((avgPrecision * avgRecall) / (avgPrecision + avgRecall)) || 0;
  
  return {
    accuracy,
    precision: avgPrecision,
    recall: avgRecall,
    f1Score,
    loss: 1 - accuracy,
  };
}
