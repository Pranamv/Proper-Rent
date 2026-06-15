import type { FaqItem } from "@/components/marketing/faq-section";

export const renterFaqs: FaqItem[] = [
  {
    question: "Can Proper Rent show me live available listings?",
    answer:
      "Not in Phase 1. The site and chatbot answer general process and fintech questions, then a human agent confirms current availability directly.",
  },
  {
    question: "Does everyone who registers reach an agent?",
    answer:
      "Yes. Website registrations are never filtered out by the score. The score only helps the agent decide how quickly to follow up.",
  },
  {
    question: "Can I ask about Deposit Share or a guarantor before registering?",
    answer:
      "Yes. The chatbot and renter page explain those products in general terms, without quoting figures for a specific property.",
  },
  {
    question: "Should I share my phone or email in chat?",
    answer:
      "No. Use the intake form for contact details. Chat transcripts are scrubbed before storage, and structured contact details belong in the form.",
  },
];

export const landlordFaqs: FaqItem[] = [
  {
    question: "Will every landlord enquiry be reviewed?",
    answer:
      "Yes. A Proper Rent agent reviews landlord enquiries and follows up where the property or rent plan is a fit.",
  },
  {
    question: "What is Advanced Rent?",
    answer:
      "Advanced Rent lets eligible landlords receive future rent as an upfront lump sum while tenants continue paying monthly.",
  },
  {
    question: "Will Proper Rent list my property automatically?",
    answer:
      "No. An agent reviews the details first, then discusses whether listing support is the right next step.",
  },
  {
    question: "Do I need to be interested in Advanced Rent to enquire?",
    answer:
      "No. You can ask about Advanced Rent, listing support, or both. The agent will discuss the right route with you.",
  },
];

export const renterFintechItems = [
  {
    title: "Deposit Share",
    body: "Covers up to 85% of your deposit on day one, so you can move in sooner and keep more cash in your pocket. Your share is returned at the end of the tenancy, and the landlord still receives the full deposit, protected as usual.",
    icon: "PiggyBank",
  },
  {
    title: "Guarantor Solutions",
    body: "Our guarantor partner can act as your UK guarantor, so you can rent the property you want, even if you're a student, new to the UK, self-employed, or on Universal Credit.",
    icon: "ShieldCheck",
  },
  {
    title: "Rent Club / Ribbon Rewards",
    body: "A renter-facing rewards benefit that can support conversion and ongoing engagement.",
    icon: "Sparkle",
  },
] as const;

export const renterAudienceSegments = [
  {
    title: "Students",
    body: "No UK guarantor? No problem. Tailored options for UK and international students.",
    icon: "GraduationCap",
  },
  {
    title: "Young Professionals",
    body: "Move faster with flexible rent options built for early-career life.",
    icon: "Briefcase",
  },
  {
    title: "Self-Employed & Freelancers",
    body: "Alternative affordability assessments, with no rigid payslip rules.",
    icon: "Wallet",
  },
  {
    title: "Universal Credit Recipients",
    body: "More pathways to successful renting, with supportive landlords.",
    icon: "ShieldCheck",
  },
  {
    title: "International Relocators",
    body: "Relocating to the UK? We help you secure a home before you land.",
    icon: "Globe",
  },
  {
    title: "Hard-to-Reference Renters",
    body: "Failed traditional referencing? We open new doors with fintech solutions.",
    icon: "Buildings",
  },
] as const;

export const advancedRentHighlights = [
  {
    title: "A lump sum, upfront",
    body: "Access future rent earlier as a lump sum instead of waiting month by month.",
    icon: "Bank",
  },
  {
    title: "Tenants pay as normal",
    body: "Tenants continue paying on their normal monthly schedule.",
    icon: "CalendarCheck",
  },
  {
    title: "Agent-confirmed eligibility",
    body: "An agent checks whether Advanced Rent fits your property and talks through the figures.",
    icon: "UserCheck",
  },
] as const;

export const howItWorksSteps = [
  {
    title: "Ask general questions",
    body: "Visitors can use the chatbot for Proper Rent, letting-process, and generic fintech questions. It does not claim live availability.",
  },
  {
    title: "Register through the form",
    body: "The renter or landlord form collects the structured details and consent that the agent needs for follow-up.",
  },
  {
    title: "Agent follows up",
    body: "A human agent reviews the briefing, confirms current options, and handles viewing, listing, or Scraye introduction work.",
  },
];
