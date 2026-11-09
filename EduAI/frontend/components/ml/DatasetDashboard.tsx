"use client";

import React, { useState } from "react";
import {
  Database,
  BarChart3,
  TrendingUp,
  Settings,
  Download,
  Upload,
  Play,
  Pause,
  RefreshCw,
  Filter,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { SAMPLE_DATASETS, Dataset, splitDataset, normalizeFeatures } from "../../lib/ml/dataset";
import { TrainingPipeline, TRAINED_MODELS } from "../../lib/ml/training";

export function DatasetDashboard() {
  const [datasets] = useState<Dataset[]>(SAMPLE_DATASETS);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"datasets" | "models" | "training">("datasets");

  const handleTrainModel = async (dataset: Dataset) => {
    setIsTraining(true);
    setTrainingProgress(0);

    const pipeline = new TrainingPipeline((progress) => {
      setTrainingProgress((progress.epoch / progress.totalEpochs) * 100);
    });

    try {
      const model = await pipeline.trainModel(dataset, {
        epochs: 50,
        batchSize: 32,
        learningRate: 0.001,
        validationSplit: 0.2,
        earlyStopping: true,
        patience: 10,
      });
      console.log("Model trained:", model);
    } catch (error) {
      console.error("Training error:", error);
    } finally {
      setIsTraining(false);
      setTrainingProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ML Dataset Management</h1>
            <p className="text-muted-foreground">Manage training datasets and model training</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground">
            <Plus className="w-4 h-4" />
            New Dataset
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab("datasets")}
            className={`px-4 py-3 font-medium transition-all border-b-2 ${
              activeTab === "datasets"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Database className="w-4 h-4 inline mr-2" />
            Datasets
          </button>
          <button
            onClick={() => setActiveTab("models")}
            className={`px-4 py-3 font-medium transition-all border-b-2 ${
              activeTab === "models"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Models
          </button>
          <button
            onClick={() => setActiveTab("training")}
            className={`px-4 py-3 font-medium transition-all border-b-2 ${
              activeTab === "training"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Training
          </button>
        </div>

        {/* Datasets Tab */}
        {activeTab === "datasets" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="glass rounded-lg p-5">
                <div className="text-2xl font-bold">{datasets.length}</div>
                <div className="text-sm text-muted-foreground">Total Datasets</div>
              </div>
              <div className="glass rounded-lg p-5">
                <div className="text-2xl font-bold">
                  {datasets.reduce((sum, d) => sum + d.size, 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Data Points</div>
              </div>
              <div className="glass rounded-lg p-5">
                <div className="text-2xl font-bold">
                  {datasets.filter(d => d.status === "training").length}
                </div>
                <div className="text-sm text-muted-foreground">Training Sets</div>
              </div>
              <div className="glass rounded-lg p-5">
                <div className="text-2xl font-bold">
                  {datasets.filter(d => d.status === "production").length}
                </div>
                <div className="text-sm text-muted-foreground">Production Sets</div>
              </div>
            </div>

            {/* Dataset List */}
            <div className="glass rounded-lg p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    placeholder="Search datasets..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background outline-none focus:border-primary"
                  />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-accent transition-colors">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
              </div>

              <div className="space-y-3">
                {datasets.map((dataset) => (
                  <motion.div
                    key={dataset.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedDataset(dataset)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Database className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{dataset.name}</div>
                        <div className="text-sm text-muted-foreground">{dataset.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{dataset.size.toLocaleString()} records</div>
                        <div className="text-xs text-muted-foreground">{dataset.features.length} features</div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dataset.status === "training"
                          ? "bg-blue-500/20 text-blue-500"
                          : dataset.status === "validation"
                          ? "bg-amber-500/20 text-amber-500"
                          : dataset.status === "test"
                          ? "bg-rose-500/20 text-rose-500"
                          : "bg-emerald-500/20 text-emerald-500"
                      }`}>
                        {dataset.status}
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-accent rounded-lg transition-colors text-rose-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Models Tab */}
        {activeTab === "models" && (
          <div className="space-y-6">
            <div className="glass rounded-lg p-5">
              <h3 className="font-semibold mb-4">Trained Models</h3>
              <div className="space-y-3">
                {TRAINED_MODELS.map((model) => (
                  <motion.div
                    key={model.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-accent/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-sm text-muted-foreground">{model.algorithm}</div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Accuracy</div>
                        <div className="font-medium text-emerald-400">{(model.metrics.accuracy * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Precision</div>
                        <div className="font-medium">{(model.metrics.precision * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Recall</div>
                        <div className="font-medium">{(model.metrics.recall * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">F1 Score</div>
                        <div className="font-medium">{(model.metrics.f1Score * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Training Tab */}
        {activeTab === "training" && (
          <div className="space-y-6">
            {selectedDataset ? (
              <div className="glass rounded-lg p-5 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedDataset.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedDataset.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedDataset(null)}
                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Dataset Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-accent/30">
                    <div className="text-sm text-muted-foreground">Data Points</div>
                    <div className="text-2xl font-bold">{selectedDataset.size.toLocaleString()}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30">
                    <div className="text-sm text-muted-foreground">Features</div>
                    <div className="text-2xl font-bold">{selectedDataset.features.length}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30">
                    <div className="text-sm text-muted-foreground">Labels</div>
                    <div className="text-2xl font-bold">{selectedDataset.labels.length}</div>
                  </div>
                </div>

                {/* Training Progress */}
                {isTraining ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Training Progress</span>
                      <span className="text-sm text-muted-foreground">{Math.round(trainingProgress)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${trainingProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <button
                      onClick={() => setIsTraining(false)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white"
                    >
                      <Pause className="w-4 h-4" />
                      Stop Training
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleTrainModel(selectedDataset)}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground"
                  >
                    <Play className="w-4 h-4" />
                    Start Training
                  </button>
                )}

                {/* Feature Importance */}
                <div>
                  <h4 className="font-medium mb-3">Feature Importance</h4>
                 <div className="space-y-2">
                    {selectedDataset.features.map((feature, i) => (
                      <div key={feature} className="flex items-center gap-3">
                        <div className="w-32 text-sm">{feature}</div>
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${100 - i * 15}%` }}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">{(100 - i * 15).toFixed(0)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass rounded-lg p-12 text-center">
                <Database className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Dataset Selected</h3>
                <p className="text-muted-foreground mb-4">Select a dataset from the Datasets tab to start training</p>
                <button
                  onClick={() => setActiveTab("datasets")}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground mx-auto"
                >
                  <Database className="w-4 h-4" />
                  Browse Datasets
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
