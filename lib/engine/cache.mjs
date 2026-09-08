/**
 * PhotoNow Local Cache & Context State Store
 *
 * Local hash-based caching for analyzed media, optimization plans, and performance tests.
 * Zero-cloud, local-filesystem and in-memory persistence.
 */

import fs from 'fs';
import path from 'path';

class EngineCache {
  constructor() {
    this.plans = new Map(); // planId -> OptimizationPlan
    this.tests = new Map(); // testId -> WebPerformanceTestResult
    this.assetAnalysisCache = new Map(); // fileHash -> AssetAnalysis
    this.lastTestId = null;
    this.lastPlanId = null;
  }

  // --- Optimization Plans ---
  savePlan(plan) {
    if (!plan || !plan.planId) return;
    this.plans.set(plan.planId, plan);
    this.lastPlanId = plan.planId;
  }

  getPlan(planId) {
    if (!planId) return this.lastPlanId ? this.plans.get(this.lastPlanId) : null;
    return this.plans.get(planId) || null;
  }

  // --- Performance Tests ---
  saveTest(testResult) {
    if (!testResult || !testResult.testId) return;
    this.tests.set(testResult.testId, testResult);
    this.lastTestId = testResult.testId;
  }

  getTest(testId) {
    if (!testId) return this.lastTestId ? this.tests.get(this.lastTestId) : null;
    return this.tests.get(testId) || null;
  }

  // --- Asset Analysis Cache ---
  getAssetAnalysis(hash) {
    return this.assetAnalysisCache.get(hash) || null;
  }

  setAssetAnalysis(hash, analysis) {
    if (hash && analysis) {
      this.assetAnalysisCache.set(hash, analysis);
    }
  }

  // --- Generic Key-Value Store ---
  get(key) {
    if (!this.genericStore) this.genericStore = new Map();
    return this.genericStore.get(key) || null;
  }

  set(key, value) {
    if (!this.genericStore) this.genericStore = new Map();
    this.genericStore.set(key, value);
  }

  clear() {
    this.plans.clear();
    this.tests.clear();
    this.assetAnalysisCache.clear();
    if (this.genericStore) this.genericStore.clear();
    this.lastTestId = null;
    this.lastPlanId = null;
  }
}

export const engineCache = new EngineCache();
