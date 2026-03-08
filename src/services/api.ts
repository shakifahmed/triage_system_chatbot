/**
 * API service layer for the Medical Triage System backend.
 *
 * Local dev:
 *   uses VITE_API_BASE_URL or http://localhost:8000
 *
 * Production on Vercel:
 *   uses Vercel serverless proxy routes under /api
 */

const API_BASE = import.meta.env.DEV
  ? (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000")
  : "/api";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SuggestInput {
  symptoms: string;
  /** Patient age — required by backend to select the correct PKL file */
  age: number;
  confirmed: string[];
  rejected: string[];
  unsure: string[];
  gender?: string;
  /**
   * Extra symptoms volunteered by the patient after the pool drains.
   * Each entry is treated as a new seed on the backend, reopening the pool
   * without resetting prior confirmed / rejected state.
   */
  additional_symptoms?: string[];
}

export interface SuggestOutput {
  next_question: string | null;
  question_text: string | null;
  score: number | null;
  has_more: boolean;
  has_severe_flag: boolean;
  matched_severe_symptoms: string[];
  /** Which age+gender PKL segment was used — useful for debugging */
  age_group: string;
}

export interface TriageInput {
  symptoms: string;
  age: number;
  gender: "Male" | "Female";
  severity: "Mild" | "Moderate" | "Severe";
  duration: number;
}

export interface TriageOutput {
  prediction_id: number;
  recommendation: "Doctor Consultation" | "Drug";
  prediction_class: number;
  confidence_percent: number;
  decision_source: string;
  llm_used: boolean;
  llm_overrode: boolean;
  user_explanation: string;
}

export interface FeedbackInput {
  rating?: number;
  feedback_text?: string;
}

export interface FeedbackOutput {
  id: number;
  message: string;
}

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  mlb_loaded: boolean;
  severe_list_loaded: boolean;
  severe_symptom_count: number;
  association_ready: boolean;
  association_pkls_loaded: number;
  association_pkl_keys: string[];
  llm_ready: boolean;
  llm_model: string | null;
  llm_main_ready: boolean;
  llm_main_model: string | null;
  llm_qa_ready: boolean;
  llm_qa_model: string | null;
}

// ── API Methods ──────────────────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API error ${res.status}: ${detail}`);
  }

  return res.json();
}

export const api = {
  health: () => request<HealthStatus>("/health"),

  suggestQuestions: (data: SuggestInput) =>
    request<SuggestOutput>("/suggest-questions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  predict: (data: TriageInput) =>
    request<TriageOutput>("/predict", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  feedback: (data: FeedbackInput) =>
    request<FeedbackOutput>("/feedback", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};