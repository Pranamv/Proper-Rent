const DEFAULT_CONSENT_VERSION = "2026-06-13";

export const CONSENT_VERSION =
  process.env.NEXT_PUBLIC_CONSENT_VERSION ?? DEFAULT_CONSENT_VERSION;

export const privacyContactEmail = "hello@properrent.co.uk";

export const consentCopy = {
  renter:
    "storing my renter enquiry and consent record, linking any website chat session I used, contacting me about my rental requirements, sending confirmation or follow-up messages, and sharing the enquiry with the Proper Rent human agent for follow-up. I understand the chatbot is for general questions and that contact details belong in this form.",
  landlord:
    "storing my landlord enquiry and consent record, contacting me about the property, sending confirmation or follow-up messages, and sharing the enquiry with the Proper Rent human agent for listing and Advanced Rent follow-up.",
} as const;
