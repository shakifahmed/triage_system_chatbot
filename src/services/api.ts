/**
 * API service layer for the Medical Triage System backend.
 *
 * The base URL defaults to http://localhost:8000 for local dev.
 * Set VITE_API_BASE_URL in .env to override.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
// const API_BASE = "http://localhost:8000";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SuggestInput {
  symptoms: string;
  confirmed: string[];
  rejected: string[];
  unsure: string[];
  gender?: string;
}

export interface SuggestOutput {
  next_question: string | null;
  question_text: string | null;
  score: number | null;
  has_more: boolean;
  has_severe_flag: boolean;
  matched_severe_symptoms: string[];
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
  llm_ready: boolean;
  llm_model: string | null;
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
  /** Check backend health */
  health: () => request<HealthStatus>("/health"),

  /** Get next suggested symptom question */
  suggestQuestions: (data: SuggestInput) =>
    request<SuggestOutput>("/suggest-questions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** Run triage prediction */
  predict: (data: TriageInput) =>
    request<TriageOutput>("/predict", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** Submit feedback */
  feedback: (data: FeedbackInput) =>
    request<FeedbackOutput>("/feedback", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
