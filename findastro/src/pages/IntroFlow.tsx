import { useState } from "react";
import IntroStepTwo from "../components/IntroStepTwo";

const IntroFlow = () => {
  const [step, setStep] = useState(1); // dots: 0 → 1 → 2

  return (
    <IntroStepTwo
      name="Varun"
      activeDot={step}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onConfirm={() => {
        if (step < 2) {
          setStep(step + 1);
        } else {
          console.log("Onboarding completed");
          // navigate("/dashboard");
        }
      }}
    />
  );
};

export default IntroFlow;
