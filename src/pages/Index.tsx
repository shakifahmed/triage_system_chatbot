import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { quickSymptoms } from "@/data/symptoms";
import { motion } from "framer-motion";
import { Stethoscope, Clock, Shield, Search } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const handleSymptomClick = (symptomId: string) => {
    navigate(`/check?symptom=${symptomId}`);
  };

  return (
    <div
      className="min-h-screen bg-lavender"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)), url('/Light%20Blue%20Illustrative%20Medical%20Project%20Presentation.svg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" />
        <div className="relative mx-auto max-w-2xl px-4 pb-12 pt-16 text-center sm:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mx-auto mb-6 flex h-230 w-40 items-center justify-center rounded-3xl bg-card shadow-lg">
              <Stethoscope className="h-20 w-20 text-primary" />
            </div>

            <h1 className="mb-4 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
              SymptomSense
            </h1>

            <p className="mb-8 text-base text-black-foreground sm:text-lg">
              Check your symptoms & find possible causes
            </p>

            <div className="mb-8 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-primary" /> Free
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-primary" /> Just 3 minutes
              </span>
              {/* <span className="flex items-center gap-1">
                <Stethoscope className="h-4 w-4 text-primary" /> By doctors
              </span> */}
            </div>

            <Button
              size="lg"
              className="mb-8 rounded-full px-10 py-6 text-lg font-semibold shadow-lg shadow-primary/25"
              onClick={() => navigate("/check")}
            >
              Start a symptom check
            </Button>
          </motion.div>

          {/* Quick Symptom Chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="mb-4 text-sm font-medium text-muted-foreground">
              Or choose a symptom to get started:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {quickSymptoms.map((symptom) => (
                <button
                  key={symptom.id}
                  onClick={() => handleSymptomClick(symptom.id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-chip px-4 py-2 text-sm font-medium text-chip-foreground transition-all hover:bg-primary/15 hover:shadow-sm"
                >
                  {symptom.name}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Browse Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8"
          >
            <button
              onClick={() => navigate("/browse")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Search className="h-4 w-4" />
              Find other symptoms
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Index;