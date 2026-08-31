import type { CredentialType } from "./stellar";

export interface IssuerTemplate {
  id: string;
  name: string;
  description: string;
  /** The credential type this template configures */
  type: CredentialType;
  /** Human-readable claim label (e.g., "Age ≥ 18") */
  claim: string;
  /** Default attribute value for the credential */
  attribute: string;
  /** Expiry duration */
  expiry: string;
  /** Icon or emoji for visual identification */
  icon: string;
  /** Category for grouping */
  category: "identity" | "financial" | "compliance" | "employment";
  /** Optional claim parameters for thresholds */
  claimParams?: {
    threshold_years?: string;
    threshold?: string;
    restricted?: string[];
    mode?: string;
  };
}

/**
 * Data-driven templates for common credential issuance scenarios.
 * Add new templates here — they appear automatically in the gallery.
 */
export const ISSUER_TEMPLATES: IssuerTemplate[] = [
  // Identity templates
  {
    id: "kyc-standard",
    name: "KYC Complete",
    description: "Standard identity verification — confirms the holder's identity has been verified.",
    type: "kyc",
    claim: "identity verified",
    attribute: "",
    expiry: "365 days",
    icon: "🔐",
    category: "identity",
  },
  {
    id: "age-18",
    name: "Age 18+",
    description: "Minimum age gate for age-restricted services and compliance.",
    type: "age",
    claim: "age ≥ 18",
    attribute: "2006-01-01",
    expiry: "365 days",
    icon: "🎂",
    category: "compliance",
    claimParams: { threshold_years: "18" },
  },
  {
    id: "age-21",
    name: "Age 21+",
    description: "Age verification for US-standard adult services (alcohol, gambling).",
    type: "age",
    claim: "age ≥ 21",
    attribute: "2003-01-01",
    expiry: "365 days",
    icon: "🎰",
    category: "compliance",
    claimParams: { threshold_years: "21" },
  },

  // Financial templates
  {
    id: "accredited-investor",
    name: "Accredited Investor",
    description: "SEC-accredited investor status (net worth ≥ $1M or income ≥ $200k).",
    type: "accreditation",
    claim: "net worth ≥ $1,000,000",
    attribute: "1000000",
    expiry: "365 days",
    icon: "💎",
    category: "financial",
    claimParams: { threshold: "1000000" },
  },
  {
    id: "proof-of-funds-50k",
    name: "Proof of Funds ≥ $50K",
    description: "Demonstrates minimum liquidity for DeFi participation or custody services.",
    type: "funds",
    claim: "balance > $50,000",
    attribute: "50000",
    expiry: "30 days",
    icon: "💰",
    category: "financial",
    claimParams: { threshold: "50000" },
  },
  {
    id: "proof-of-funds-100k",
    name: "Proof of Funds ≥ $100K",
    description: "Higher liquidity tier for institutional or whale-gated pools.",
    type: "funds",
    claim: "balance > $100,000",
    attribute: "100000",
    expiry: "30 days",
    icon: "🏦",
    category: "financial",
    claimParams: { threshold: "100000" },
  },
  {
    id: "income-200k",
    name: "High Income ≥ $200K",
    description: "Income threshold for accredited investor or premium service eligibility.",
    type: "income",
    claim: "income > $200,000",
    attribute: "200000",
    expiry: "365 days",
    icon: "📈",
    category: "financial",
    claimParams: { threshold: "200000" },
  },

  // Compliance templates
  {
    id: "eu-resident",
    name: "EU Resident",
    description: "Verifies the holder is located in an EU member state (non-restricted).",
    type: "jurisdiction",
    claim: "EU resident (not restricted)",
    attribute: "276",
    expiry: "180 days",
    icon: "🇪🇺",
    category: "compliance",
  },
  {
    id: "us-non-restricted",
    name: "US Non-Restricted",
    description: "US-based holder for DeFi protocols requiring OFAC compliance.",
    type: "jurisdiction",
    claim: "US resident (non-restricted)",
    attribute: "840",
    expiry: "180 days",
    icon: "🇺🇸",
    category: "compliance",
  },
  {
    id: "non-restricted-jurisdiction",
    name: "Non-Restricted Jurisdiction",
    description: "General jurisdiction check — holder is not in a sanctions-restricted country.",
    type: "jurisdiction",
    claim: "country not restricted",
    attribute: "566",
    expiry: "180 days",
    icon: "🌍",
    category: "compliance",
  },

  // Employment templates
  {
    id: "employed-1yr",
    name: "Employed ≥ 1 Year",
    description: "Employment verification with minimum 1-year seniority.",
    type: "employment",
    claim: "employed, seniority ≥ 1",
    attribute: "1",
    expiry: "180 days",
    icon: "💼",
    category: "employment",
    claimParams: { threshold_years: "1" },
  },
  {
    id: "employed-3yr",
    name: "Employed ≥ 3 Years",
    description: "Employment verification with minimum 3-year seniority.",
    type: "employment",
    claim: "employed, seniority ≥ 3",
    attribute: "3",
    expiry: "180 days",
    icon: "👔",
    category: "employment",
    claimParams: { threshold_years: "3" },
  },
  {
    id: "employed-5yr",
    name: "Employed ≥ 5 Years",
    description: "Employment verification with minimum 5-year seniority.",
    type: "employment",
    claim: "employed, seniority ≥ 5",
    attribute: "5",
    expiry: "180 days",
    icon: "🏛️",
    category: "employment",
    claimParams: { threshold_years: "5" },
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: "identity", label: "Identity", icon: "🔐" },
  { id: "financial", label: "Financial", icon: "💰" },
  { id: "compliance", label: "Compliance", icon: "⚖️" },
  { id: "employment", label: "Employment", icon: "💼" },
] as const;
