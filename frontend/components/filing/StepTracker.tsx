"use client";
import { getSteps, getStepLabel } from "@/lib/utils";

interface Props {
  formType: string;
  currentStep: string;
  completedSteps: string[];
}

export default function StepTracker({ formType, currentStep, completedSteps }: Props) {
  const steps = getSteps(formType || "ITR-1");

  return (
    <div style={{ padding: "1rem 0" }}>
      <div style={{
        fontSize: "0.62rem", color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.08em",
        marginBottom: "0.75rem", paddingLeft: "1rem", fontWeight: 600,
      }}>
        Progress
      </div>
      {steps.map((step) => {
        const isDone = completedSteps.includes(step);
        const isCurrent = step === currentStep;
        return (
          <div key={step} className="step-item">
            <span className={`step-dot ${isDone ? "step-dot-done" : isCurrent ? "step-dot-current" : "step-dot-pending"}`}>
              {isDone ? "✓" : ""}
            </span>
            <span className={isDone ? "step-label-done" : isCurrent ? "step-label-current" : "step-label-pending"}>
              {getStepLabel(step)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
