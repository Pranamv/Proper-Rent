import type { FaqItem } from "@/components/marketing/faq-section";

export const renterFaqs: FaqItem[] = [
  {
    question: "Can Proper Rent show me live available listings?",
    answer:
      "Not directly on the website. A Proper Rent agent confirms current availability and viewing options after registration.",
  },
  {
    question: "Does everyone who registers reach an agent?",
    answer:
      "Yes. Website registrations are never filtered out by the score. The score only helps the agent decide how quickly to follow up.",
  },
  {
    question: "Can I ask about Deposit Share or a guarantor before registering?",
    answer:
      "Yes. The tenant page explains those options in general terms. A Proper Rent agent confirms what applies to your situation after you register.",
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
    body: "Can reduce the deposit you need upfront while the landlord still receives the full protected deposit.",
    icon: "PiggyBank",
  },
  {
    title: "Guarantor Solutions",
    body: "Useful if you are a student, new to the UK, self-employed, on Universal Credit, or without a traditional guarantor.",
    icon: "ShieldCheck",
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
    title: "Learn about your options",
    body: "The website explains the Proper Rent process, deposit support, and guarantor options before you register.",
  },
  {
    title: "Register through the form",
    body: "The tenant or landlord form collects the structured details and consent the agent needs for follow-up.",
  },
  {
    title: "Agent follows up",
    body: "The agent reviews the brief, confirms current options, and moves things forward with the right next step.",
  },
];
