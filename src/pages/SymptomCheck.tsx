import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { symptomCategories } from "@/data/symptoms";

const SymptomCheck = () => {
  const [searchParams] = useSearchParams();
  const preselectedSymptom = searchParams.get("symptom");
  const navigate = useNavigate();

  // If symptom is preselected (from browse), skip the symptom step
  const hasPreselected = !!preselectedSymptom;
  const TOTAL_STEPS = hasPreselected ? 3 : 4;

  const [step, setStep] = useState(1);
  const [sex, setSex] = useState("");
  const [age, setAge] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(preselectedSymptom ? [preselectedSymptom] : []);
  const [symptomSearch, setSymptomSearch] = useState("");
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [duration, setDuration] = useState("");

  const progress = (step / TOTAL_STEPS) * 100;

  // Steps: 1=sex, 2=age, 3=symptom (if no preselected), 4=duration
  // If preselected: 1=sex, 2=age, 3=duration
  const isSymptomStep = !hasPreselected && step === 3;
  const isDurationStep = hasPreselected ? step === 3 : step === 4;

  const filteredCategories = symptomCategories
    .map((cat) => ({
      ...cat,
      symptoms: cat.symptoms.filter((s) =>
        s.name.toLowerCase().includes(symptomSearch.toLowerCase())
      ),
    }))
    .filter((cat) => cat.symptoms.length > 0);

  useEffect(() => {
    if (symptomSearch.trim()) {
      setOpenItems(filteredCategories.map((cat) => cat.name));
    } else {
      setOpenItems([]);
    }
  }, [symptomSearch]);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const formatSymptomName = (id: string) =>
    id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const canProceed = () => {
    if (step === 1) return sex !== "";
    if (step === 2) return age !== "" && Number(age) > 0;
    if (isSymptomStep) return selectedSymptoms.length > 0;
    if (isDurationStep) return duration !== "" && Number(duration) > 0;
    return false;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      const symptoms = selectedSymptoms.length > 0 ? selectedSymptoms.join(",") : "headache";
      navigate(`/chat?symptom=${symptoms}&sex=${sex}&age=${age}&duration=${duration}`);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate("/");
  };

  return (
    <div
      className="min-h-screen bg-lavender"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)), url('/Light%20Blue%20Illustrative%20Medical%20Project%20Presentation_Symptoms_search.svg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="mx-auto max-w-lg px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            Step {step} of {TOTAL_STEPS}
          </span>
          <button
            onClick={() => navigate("/")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm transition-colors hover:bg-secondary"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <Progress value={progress} className="mb-8 h-2" />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl bg-card p-6 shadow-sm"
          >
            {step === 1 && (
              <div>
                <h2 className="mb-2 text-xl font-bold text-foreground">
                  What is your sex at birth?
                </h2>
                <Accordion type="single" collapsible className="mb-6">
                  <AccordionItem value="info" className="border-none">
                    <AccordionTrigger className="py-2 text-xs text-primary hover:no-underline">
                      Why do we ask this?
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-muted-foreground">
                      Biological sex can influence symptom presentation and risk factors for certain conditions. This helps us provide more accurate results.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <RadioGroup value={sex} onValueChange={setSex} className="space-y-3">
                  {[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                  ].map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={option.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                        sex === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <span className="font-medium">{option.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="mb-2 text-xl font-bold text-foreground">
                  How old are you?
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  Your age helps us narrow down possible conditions.
                </p>
                <Input
                  type="number"
                  placeholder="Enter your age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min={1}
                  max={120}
                  className="rounded-xl text-center text-lg"
                />
              </div>
            )}

            {isSymptomStep && (
              <div>
                <h2 className="mb-2 text-xl font-bold text-foreground">
                  What symptoms are you experiencing?
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Search or browse categories to select your symptoms.
                </p>
                {selectedSymptoms.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {selectedSymptoms.map((id) => (
                      <div
                        key={id}
                        className="flex items-center gap-1.5 rounded-full border-2 border-primary bg-primary/5 px-3 py-1.5"
                      >
                        <span className="text-xs font-medium text-foreground">
                          {formatSymptomName(id)}
                        </span>
                        <button
                          onClick={() => toggleSymptom(id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search symptoms..."
                    value={symptomSearch}
                    onChange={(e) => setSymptomSearch(e.target.value)}
                    className="rounded-full pl-10"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-border">
                  <Accordion type="multiple" className="w-full" value={openItems} onValueChange={setOpenItems}>
                    {filteredCategories.map((category) => (
                      <AccordionItem key={category.name} value={category.name}>
                        <AccordionTrigger className="px-3 text-sm font-semibold hover:no-underline">
                          <span className="flex items-center gap-2">
                            {category.name}
                            <span className="text-xs font-normal text-muted-foreground">({category.symptoms.length})</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-wrap gap-2 px-3 pb-2">
                            {category.symptoms.map((symptom) => (
                              <button
                                key={symptom.id}
                                onClick={() => toggleSymptom(symptom.id)}
                                className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                                  selectedSymptoms.includes(symptom.id)
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-chip text-chip-foreground hover:bg-primary/15"
                                }`}
                              >
                                {symptom.name}
                              </button>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            )}

            {isDurationStep && (
              <div>
                <h2 className="mb-2 text-xl font-bold text-foreground">
                  How many days have you had this symptom?
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  Duration helps determine urgency and possible causes.
                </p>
                <Input
                  type="number"
                  placeholder="Number of days"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min={1}
                  className="rounded-xl text-center text-lg"
                />
              </div>
            )}

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="mt-6 w-full rounded-full py-6 text-base font-semibold"
            >
              {step === TOTAL_STEPS ? "Start Chat" : "Next"}
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SymptomCheck;
