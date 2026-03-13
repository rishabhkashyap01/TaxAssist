// TypeScript mirrors of Python dataclasses in backend/src/itr_models.py

export interface PersonalInfo {
  pan: string;
  name: string;
  dob: string;
  aadhaar: string;
  address: string;
  pincode: string;
  email: string;
  mobile: string;
  residential_status: string;
  filing_status: string;
}

export interface SalaryIncome {
  gross_salary: number;
  exempt_allowances: { hra: number; lta: number; other: number };
  standard_deduction: number;
  professional_tax: number;
  employer_name: string;
  employer_tan: string;
}

export interface HousePropertyIncome {
  property_type: string;
  rental_income: number;
  municipal_tax: number;
  home_loan_interest: number;
}

export interface OtherIncome {
  savings_interest: number;
  fd_interest: number;
  dividend_income: number;
  family_pension: number;
  agricultural_income: number;
  other: number;
}

export interface CapitalGains {
  stcg_15: number;
  stcg_slab: number;
  ltcg_10: number;
  ltcg_20: number;
}

export interface BusinessIncome {
  business_type: string;
  gross_turnover: number;
  presumptive_income: number;
  net_profit: number;
  presumptive_scheme: string;
}

export interface Deductions {
  sec_80c: number;
  sec_80ccc: number;
  sec_80ccd_1: number;
  sec_80ccd_1b: number;
  sec_80ccd_2: number;
  sec_80d_self: number;
  sec_80d_parents: number;
  sec_80dd: number;
  sec_80ddb: number;
  sec_80e: number;
  sec_80ee: number;
  sec_80eea: number;
  sec_80eeb: number;
  sec_80g: number;
  sec_80gg: number;
  sec_80tta: number;
  sec_80ttb: number;
  sec_80u: number;
}

export interface TaxPayments {
  tds_salary: number;
  tds_other: number;
  tcs: number;
  advance_tax: number;
  self_assessment_tax: number;
}

export interface BankAccount {
  bank_name: string;
  ifsc: string;
  account_number: string;
  is_refund_account: boolean;
}

export interface ITRFiling {
  form_type: string;
  assessment_year: string;
  regime: string;
  personal: PersonalInfo;
  salary: SalaryIncome;
  house_property: HousePropertyIncome[];
  other_income: OtherIncome;
  capital_gains: CapitalGains | null;
  business_income: BusinessIncome | null;
  deductions: Deductions;
  tax_payments: TaxPayments;
  bank_accounts: BankAccount[];
  current_step: string;
  completed_steps: string[];
  created_at: string;
  updated_at: string;
}

export interface FilingMeta {
  filing_id: string;
  pan: string;
  name: string;
  form_type: string;
  assessment_year: string;
  current_step: string;
  updated_at: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface AuthUser {
  user_id: string;
  username: string;
}

// Default blank filing — mirrors ITRFiling() in Python
export function createDefaultFiling(): ITRFiling {
  const now = new Date().toISOString();
  return {
    form_type: "",
    assessment_year: "2025-26",
    regime: "new",
    personal: {
      pan: "", name: "", dob: "", aadhaar: "",
      address: "", pincode: "", email: "", mobile: "",
      residential_status: "resident", filing_status: "original",
    },
    salary: {
      gross_salary: 0,
      exempt_allowances: { hra: 0, lta: 0, other: 0 },
      standard_deduction: 0,
      professional_tax: 0,
      employer_name: "",
      employer_tan: "",
    },
    house_property: [],
    other_income: {
      savings_interest: 0, fd_interest: 0, dividend_income: 0,
      family_pension: 0, agricultural_income: 0, other: 0,
    },
    capital_gains: null,
    business_income: null,
    deductions: {
      sec_80c: 0, sec_80ccc: 0, sec_80ccd_1: 0, sec_80ccd_1b: 0,
      sec_80ccd_2: 0, sec_80d_self: 0, sec_80d_parents: 0, sec_80dd: 0,
      sec_80ddb: 0, sec_80e: 0, sec_80ee: 0, sec_80eea: 0, sec_80eeb: 0,
      sec_80g: 0, sec_80gg: 0, sec_80tta: 0, sec_80ttb: 0, sec_80u: 0,
    },
    tax_payments: {
      tds_salary: 0, tds_other: 0, tcs: 0,
      advance_tax: 0, self_assessment_tax: 0,
    },
    bank_accounts: [],
    current_step: "welcome",
    completed_steps: [],
    created_at: now,
    updated_at: now,
  };
}
