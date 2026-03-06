import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { symptomCategories } from "@/data/symptoms";
import { ArrowLeft, Search, X } from "lucide-react";
import { motion } from "framer-motion";

const SymptomBrowse = () => {
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const navigate = useNavigate();

  const filtered = symptomCategories
    .map((cat) => ({
      ...cat,
      symptoms: cat.symptoms.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.symptoms.length > 0);

  // Auto-expand all matching categories when searching
  useEffect(() => {
    if (search.trim()) {
      setOpenItems(filtered.map((cat) => cat.name));
    } else {
      setOpenItems([]);
    }
  }, [search]);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const formatSymptomName = (id: string) =>
    id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const handleContinue = () => {
    navigate(`/check?symptom=${selectedSymptoms.join(",")}`);
  };

  return (
    <div
      className="min-h-screen bg-lavender"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)), url('/Light%20Blue%20Illustrative%20Medical%20Project%20Presentation_search.svg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Find a Symptom</h1>
        </div>

        {/* Selected symptoms */}
        {selectedSymptoms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex flex-wrap gap-2"
          >
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
          </motion.div>
        )}

        {/* Continue button */}
        {selectedSymptoms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Button
              onClick={handleContinue}
              className="w-full rounded-full py-6 text-base font-semibold"
            >
              Continue with {selectedSymptoms.length} symptom{selectedSymptoms.length > 1 ? "s" : ""}
            </Button>
          </motion.div>
        )}

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search symptoms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-full bg-card pl-10 shadow-sm"
            />
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card p-4 shadow-sm"
        >
          <Accordion type="multiple" className="w-full" value={openItems} onValueChange={setOpenItems}>
            {filtered.map((category) => (
              <AccordionItem key={category.name} value={category.name}>
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  <span className="flex items-center gap-2">
                    {category.name}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({category.symptoms.length})
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2 pb-2">
                    {category.symptoms.map((symptom) => (
                      <button
                        key={symptom.id}
                        onClick={() => toggleSymptom(symptom.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
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
        </motion.div>
      </div>
    </div>
  );
};

export default SymptomBrowse;
