// Step definitions — mirrors FILING_STEPS and STEP_LABELS from backend/src/itr_prompts.py
export const FILING_STEPS: Record<string, string[]> = {
  "ITR-1": ["welcome","form_selection","personal_info","regime_selection","salary_income","house_property","other_income","deductions","tax_computation","tax_payments","bank_details","summary"],
  "ITR-2": ["welcome","form_selection","personal_info","regime_selection","salary_income","house_property","other_income","capital_gains","deductions","tax_computation","tax_payments","bank_details","summary"],
  "ITR-3": ["welcome","form_selection","personal_info","regime_selection","salary_income","business_income","house_property","other_income","capital_gains","deductions","tax_computation","tax_payments","bank_details","summary"],
  "ITR-4": ["welcome","form_selection","personal_info","regime_selection","presumptive_income","house_property","other_income","deductions","tax_computation","tax_payments","bank_details","summary"],
};

export const STEP_LABELS: Record<string, string> = {
  welcome: "Welcome",
  form_selection: "Select ITR Form",
  personal_info: "Personal Information",
  regime_selection: "Tax Regime",
  salary_income: "Salary Income",
  house_property: "House Property",
  other_income: "Other Income",
  capital_gains: "Capital Gains",
  business_income: "Business Income",
  presumptive_income: "Business Income",
  deductions: "Deductions",
  tax_computation: "Tax Computation",
  tax_payments: "Tax Payments",
  bank_details: "Bank Details",
  summary: "Summary & Review",
};

export function getSteps(formType: string): string[] {
  return FILING_STEPS[formType] ?? FILING_STEPS["ITR-1"];
}

export function getStepLabel(step: string): string {
  return STEP_LABELS[step] ?? step;
}

export function getStepProgress(formType: string, currentStep: string): { current: number; total: number } {
  const steps = getSteps(formType);
  const idx = steps.indexOf(currentStep);
  return { current: idx < 0 ? 0 : idx, total: steps.length };
}

export function formatRelativeTime(isoString: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
