import { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { quickSymptoms, symptomCategories, type ChatMessage } from "@/data/symptoms";
import { api, type TriageOutput } from "@/services/api";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, AlertTriangle, RotateCcw, Stethoscope, Loader2, MessageSquare } from "lucide-react";

const findSymptomName = (id: string): string => {
  const quick = quickSymptoms.find((s) => s.id === id);
  if (quick) return quick.name;
  for (const cat of symptomCategories) {
    const found = cat.symptoms.find((s) => s.id === id);
    if (found) return found.name;
  }
  return id.replace(/-/g, " ");
};

interface LocationState {
  symptoms: string;
  age: number;
  gender: "Male" | "Female";
  severity: string;
  duration: number;
  symptomLabel: string;
  confirmedSymptoms: string[];
  chatMessages?: ChatMessage[];
  chatParams?: { symptom: string; sex: string; age: string; duration: string };
}

const Results = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as LocationState | null;

  // Derive initial symptom names from state or URL
  const symptomLabel = state?.symptomLabel || searchParams.get("symptom") || "";
  const initialSymptomNames = symptomLabel
    ? symptomLabel.split(/,\s*| and /).map((s) => s.trim()).filter(Boolean)
    : [];

  const [prediction, setPrediction] = useState<TriageOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state) {
      setLoading(false);
      setError("No triage data available. Please start a new symptom check.");
      return;
    }

    const fetchPrediction = async () => {
      try {
        const severityMap: Record<string, "Mild" | "Moderate" | "Severe"> = {
          Mild: "Mild",
          Moderate: "Moderate",
          Severe: "Severe",
        };
        const result = await api.predict({
          symptoms: state.symptoms,
          age: state.age,
          gender: state.gender,
          severity: severityMap[state.severity] || "Mild",
          duration: state.duration,
        });
        setPrediction(result);
      } catch (err) {
        console.error("Predict error:", err);
        setError("Could not get a prediction. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [state]);

  const getSeverityConfig = (recommendation: string) => {
    if (recommendation === "Doctor Consultation") {
      return {
        icon: AlertCircle,
        label: "Doctor Consultation Recommended",
        className: "text-severity-serious bg-severity-serious/10 border-severity-serious/20",
      };
    }
    return {
      icon: CheckCircle,
      label: "Self-Care or Self Medication May Suffice",
      className: "text-severity-mild bg-severity-mild/10 border-severity-mild/20",
    };
  };

  return (
    <div
      className="min-h-screen bg-lavender"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)), url('/Light%20Blue%20Illustrative%20Medical%20Project%20Presentation_result.svg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Stethoscope className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-1 text-2xl font-bold text-foreground">Your Results</h1>
          <p className="text-sm text-muted-foreground">Based on your symptoms</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {initialSymptomNames.map((name) => (
              <span
                key={name}
                className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary"
              >
                {name}
              </span>
            ))}
            {state?.confirmedSymptoms && state.confirmedSymptoms.map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary"
              >
                {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center text-xs text-muted-foreground"
        >
          ⚠️ This is not a medical diagnosis. Please consult a healthcare professional for proper
          evaluation.
        </motion.div>

        {/* Loading */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 py-12"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing your symptoms...</p>
          </motion.div>
        )}

        {/* Error */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card p-6 text-center shadow-sm"
          >
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-severity-moderate" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </motion.div>
        )}

        {/* Prediction Result */}
        {prediction && !loading && (
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl bg-card p-6 shadow-sm"
            >
              {(() => {
                const sev = getSeverityConfig(prediction.recommendation);
                const Icon = sev.icon;
                return (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">Triage Recommendation</h3>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${sev.className}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {sev.label}
                      </span>
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                      {prediction.user_explanation}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>
                        Confidence:{" "}
                        <span className="font-medium">{prediction.confidence_percent.toFixed(1)}%</span>
                      </span>
                      <span>
                        Source: <span className="font-medium">{prediction.decision_source.replace(/_/g, " ")}</span>
                      </span>
                      {prediction.llm_used && (
                        <span className="font-medium text-primary">AI-reviewed</span>
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          {state?.chatMessages && state.chatMessages.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                const params = state.chatParams;
                navigate(
                  `/chat?symptom=${params?.symptom || ""}&sex=${params?.sex || ""}&age=${params?.age || "25"}&duration=${params?.duration || "1"}`,
                  { state: { chatMessages: state.chatMessages } }
                );
              }}
              className="rounded-full px-8 py-6 text-base font-semibold"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              View Chat History
            </Button>
          )}
          <Button
            onClick={() => navigate("/")}
            className="rounded-full px-8 py-6 text-base font-semibold"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Start a new check
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Results;