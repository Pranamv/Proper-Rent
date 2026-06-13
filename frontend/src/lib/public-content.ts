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
    question: "Are landlord leads scored?",
    answer:
      "No. Every landlord submission notifies the agent because listing and Advanced Rent opportunities are inherently valuable.",
  },
  {
    question: "What is Advanced Rent?",
    answer:
      "Advanced Rent is a landlord-side proposition for receiving rent upfront while tenants continue paying monthly.",
  },
  {
    question: "Will Proper Rent list my property automatically?",
    answer:
      "No. In Phase 1, an agent reviews the details and follows up manually to discuss listing and next steps.",
  },
  {
    question: "Do I need to be interested in Advanced Rent to enquire?",
    answer:
      "No. You can register interest in listing, Advanced Rent, or both. The agent will discuss the right route with you.",
  },
];

export const renterFintechItems = [
  {
    title: "Deposit Share",
    body: "Helps reduce upfront deposit pressure for renters who are otherwise ready to move.",
  },
  {
    title: "Guarantor and Guarantor Enhanced",
    body: "Useful for students, international renters, self-employed renters, Universal Credit tenants, and renters with limited credit history.",
  },
  {
    title: "Rent Club / Ribbon Rewards",
    body: "A renter-facing rewards benefit that can support conversion and ongoing engagement.",
  },
];

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
