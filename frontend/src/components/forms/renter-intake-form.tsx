"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";

import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckboxInput,
  Field,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/ui/field";
import { ApiError, publicApi } from "@/lib/api";
import type { RenterLeadRequest, RenterLeadResponse } from "@/lib/api";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const CONSENT_VERSION = "2026-06-13";
const SESSION_STORAGE_KEY = "proper-rent-session-id";

const steps = [
  {
    title: "Your details",
    description: "Contact details are collected here, not in chat.",
    fields: ["fullName", "email", "phone"] as const,
  },
  {
    title: "Rental requirements",
    description: "Tell the agent what to look for before follow-up.",
    fields: ["bedroomsRequired", "areasPreferred", "maxRent", "moveInFrom", "moveInBy"] as const,
  },
  {
    title: "Readiness",
    description: "These answers help prioritise follow-up and flag useful fintech options.",
    fields: ["employmentStatus", "hasGuarantor", "depositAvailability", "currentHousing"] as const,
  },
  {
    title: "Review and consent",
    description: "Confirm consent so the enquiry can be saved and sent to the agent.",
    fields: ["consentGiven"] as const,
  },
] as const;

const employmentOptions = [
  { value: "employed_full", label: "Employed full-time" },
  { value: "employed_part", label: "Employed part-time" },
  { value: "self_employed", label: "Self-employed" },
  { value: "student", label: "Student" },
  { value: "universal_credit", label: "Universal Credit" },
  { value: "other", label: "Other" },
] as const;

const incomeOptions = [
  { value: "", label: "Prefer not to say" },
  { value: "under_25000", label: "Under 25,000" },
  { value: "25000-35000", label: "25,000-35,000" },
  { value: "35000-50000", label: "35,000-50,000" },
  { value: "50000_plus", label: "50,000+" },
] as const;

const guarantorOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Unsure" },
] as const;

const depositOptions = [
  { value: "full", label: "Full deposit available" },
  { value: "partial", label: "Some deposit available" },
  { value: "limited", label: "Limited upfront deposit" },
] as const;

const currentHousingOptions = [
  { value: "renting", label: "Currently renting" },
  { value: "family", label: "Living with family or friends" },
  { value: "owning", label: "Currently own a home" },
] as const;

const furnishedOptions = [
  { value: "no_preference", label: "No preference" },
  { value: "furnished", label: "Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
] as const;

const rentedBeforeOptions = [
  { value: "", label: "Prefer not to say" },
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
] as const;

const howHeardOptions = [
  { value: "", label: "Select one" },
  { value: "google", label: "Google" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "referral", label: "Referral" },
  { value: "scraye", label: "Scraye" },
  { value: "other", label: "Other" },
] as const;

type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  bedroomsRequired: string;
  areasPreferred: string;
  maxRent: string;
  moveInFrom: string;
  moveInBy: string;
  employmentStatus: RenterLeadRequest["employment_status"] | "";
  annualIncomeRange: string;
  hasGuarantor: RenterLeadRequest["has_guarantor"] | "";
  depositAvailability: RenterLeadRequest["deposit_availability"] | "";
  currentHousing: RenterLeadRequest["current_housing"] | "";
  howHeard: string;
  furnishedPreference: NonNullable<RenterLeadRequest["furnished_preference"]>;
  pets: string;
  accessibilityNeeds: string;
  hasRentedBefore: "" | "true" | "false";
  notes: string;
  consentGiven: boolean;
};

type FormField = keyof FormValues;
type FormErrors = Partial<Record<FormField, string>>;

const initialValues: FormValues = {
  fullName: "",
  email: "",
  phone: "",
  bedroomsRequired: "",
  areasPreferred: "",
  maxRent: "",
  moveInFrom: "",
  moveInBy: "",
  employmentStatus: "",
  annualIncomeRange: "",
  hasGuarantor: "",
  depositAvailability: "",
  currentHousing: "",
  howHeard: "",
  furnishedPreference: "no_preference",
  pets: "",
  accessibilityNeeds: "",
  hasRentedBefore: "",
  notes: "",
  consentGiven: false,
};

export function RenterIntakeForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<RenterLeadResponse | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resolvedSessionId = resolveSessionId(params);
    setSessionId(resolvedSessionId);
    setValues((current) => applyQueryPrefill(current, params));
  }, []);

  const progressLabel = `Step ${activeStep + 1} of ${steps.length}`;
  const currentStep = steps[activeStep];
  const areas = useMemo(() => parseAreas(values.areasPreferred), [values.areasPreferred]);

  function updateValue<FieldName extends FormField>(
    field: FieldName,
    value: FormValues[FieldName],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  }

  function handleTextChange(
    field: Exclude<FormField, "consentGiven">,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    updateValue(field, event.target.value as FormValues[typeof field]);
  }

  function goToNextStep() {
    const nextErrors = validateStep(values, activeStep);
    setErrors((current) => ({ ...current, ...nextErrors }));
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setActiveStep((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToPreviousStep() {
    setActiveStep((current) => Math.max(current - 1, 0));
    setSubmitError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateAll(values);
    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      setActiveStep(firstStepWithError(nextErrors));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await publicApi.createRenterLead(buildPayload(values, sessionId));
      setSuccess(response);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setSubmitError("Some details could not be accepted. Check the form and try again.");
      } else {
        setSubmitError(
          "We could not submit the form right now. Please try again, or contact the team directly.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return <RenterIntakeSuccess message={success.message} />;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardHeader>
            <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
              {progressLabel}
            </p>
            <CardTitle>{currentStep.title}</CardTitle>
            <CardDescription>{currentStep.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {steps.map((step, index) => (
                <li
                  className={cn(
                    "flex gap-3 rounded-md border border-border bg-surface p-3",
                    index === activeStep && "border-primary bg-accent/60",
                  )}
                  aria-current={index === activeStep ? "step" : undefined}
                  key={step.title}
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full border border-border text-sm font-bold",
                      index <= activeStep && "border-primary bg-primary text-primary-foreground",
                    )}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">
                      {step.title}
                    </span>
                    <span className="block text-sm leading-5 text-muted">
                      {step.description}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </aside>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle>{currentStep.title}</CardTitle>
          <CardDescription>{currentStep.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} noValidate>
            {submitError ? <FormAlert>{submitError}</FormAlert> : null}

            {activeStep === 0 ? (
              <div className="grid gap-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field error={errors.fullName}>
                    <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                    <TextInput
                      autoComplete="name"
                      id="fullName"
                      name="fullName"
                      onChange={(event) => handleTextChange("fullName", event)}
                      value={values.fullName}
                    />
                  </Field>
                  <Field error={errors.email}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <TextInput
                      autoComplete="email"
                      id="email"
                      inputMode="email"
                      name="email"
                      onChange={(event) => handleTextChange("email", event)}
                      type="email"
                      value={values.email}
                    />
                  </Field>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field error={errors.phone}>
                    <FieldLabel htmlFor="phone">Phone</FieldLabel>
                    <TextInput
                      autoComplete="tel"
                      id="phone"
                      inputMode="tel"
                      name="phone"
                      onChange={(event) => handleTextChange("phone", event)}
                      value={values.phone}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="howHeard">How did you hear about us?</FieldLabel>
                    <SelectInput
                      id="howHeard"
                      name="howHeard"
                      onChange={(event) => handleTextChange("howHeard", event)}
                      value={values.howHeard}
                    >
                      {howHeardOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                </div>
              </div>
            ) : null}

            {activeStep === 1 ? (
              <div className="grid gap-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field error={errors.bedroomsRequired}>
                    <FieldLabel htmlFor="bedroomsRequired">Bedrooms required</FieldLabel>
                    <SelectInput
                      id="bedroomsRequired"
                      name="bedroomsRequired"
                      onChange={(event) => handleTextChange("bedroomsRequired", event)}
                      value={values.bedroomsRequired}
                    >
                      <option value="">Select bedrooms</option>
                      <option value="0">Studio</option>
                      <option value="1">1 bedroom</option>
                      <option value="2">2 bedrooms</option>
                      <option value="3">3 bedrooms</option>
                      <option value="4">4 bedrooms</option>
                      <option value="5">5+ bedrooms</option>
                    </SelectInput>
                  </Field>
                  <Field error={errors.maxRent}>
                    <FieldLabel htmlFor="maxRent">Maximum monthly rent</FieldLabel>
                    <TextInput
                      id="maxRent"
                      inputMode="numeric"
                      min="1"
                      name="maxRent"
                      onChange={(event) => handleTextChange("maxRent", event)}
                      placeholder="1200"
                      type="number"
                      value={values.maxRent}
                    />
                    <FieldHint>Enter the monthly budget before bills.</FieldHint>
                  </Field>
                </div>
                <Field error={errors.areasPreferred}>
                  <FieldLabel htmlFor="areasPreferred">Preferred areas</FieldLabel>
                  <TextArea
                    id="areasPreferred"
                    name="areasPreferred"
                    onChange={(event) => handleTextChange("areasPreferred", event)}
                    placeholder="Manchester City Centre, Salford, Ancoats"
                    value={values.areasPreferred}
                  />
                  <FieldHint>Use commas or new lines. At least one area is required.</FieldHint>
                </Field>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field error={errors.moveInFrom}>
                    <FieldLabel htmlFor="moveInFrom">Earliest move-in date</FieldLabel>
                    <TextInput
                      id="moveInFrom"
                      name="moveInFrom"
                      onChange={(event) => handleTextChange("moveInFrom", event)}
                      type="date"
                      value={values.moveInFrom}
                    />
                  </Field>
                  <Field error={errors.moveInBy}>
                    <FieldLabel htmlFor="moveInBy">Latest move-in date</FieldLabel>
                    <TextInput
                      id="moveInBy"
                      name="moveInBy"
                      onChange={(event) => handleTextChange("moveInBy", event)}
                      type="date"
                      value={values.moveInBy}
                    />
                  </Field>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="furnishedPreference">Furnished preference</FieldLabel>
                    <SelectInput
                      id="furnishedPreference"
                      name="furnishedPreference"
                      onChange={(event) => handleTextChange("furnishedPreference", event)}
                      value={values.furnishedPreference}
                    >
                      {furnishedOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="pets">Pets</FieldLabel>
                    <TextInput
                      id="pets"
                      maxLength={100}
                      name="pets"
                      onChange={(event) => handleTextChange("pets", event)}
                      placeholder="None, cat, small dog..."
                      value={values.pets}
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="accessibilityNeeds">Accessibility needs</FieldLabel>
                  <TextArea
                    id="accessibilityNeeds"
                    name="accessibilityNeeds"
                    onChange={(event) => handleTextChange("accessibilityNeeds", event)}
                    placeholder="Step-free access, lift, parking, or anything the agent should know."
                    value={values.accessibilityNeeds}
                  />
                </Field>
              </div>
            ) : null}

            {activeStep === 2 ? (
              <div className="grid gap-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field error={errors.employmentStatus}>
                    <FieldLabel htmlFor="employmentStatus">Employment status</FieldLabel>
                    <SelectInput
                      id="employmentStatus"
                      name="employmentStatus"
                      onChange={(event) => handleTextChange("employmentStatus", event)}
                      value={values.employmentStatus}
                    >
                      <option value="">Select status</option>
                      {employmentOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="annualIncomeRange">Annual income range</FieldLabel>
                    <SelectInput
                      id="annualIncomeRange"
                      name="annualIncomeRange"
                      onChange={(event) => handleTextChange("annualIncomeRange", event)}
                      value={values.annualIncomeRange}
                    >
                      {incomeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field error={errors.hasGuarantor}>
                    <FieldLabel htmlFor="hasGuarantor">Do you have a guarantor?</FieldLabel>
                    <SelectInput
                      id="hasGuarantor"
                      name="hasGuarantor"
                      onChange={(event) => handleTextChange("hasGuarantor", event)}
                      value={values.hasGuarantor}
                    >
                      <option value="">Select one</option>
                      {guarantorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field error={errors.depositAvailability}>
                    <FieldLabel htmlFor="depositAvailability">Deposit availability</FieldLabel>
                    <SelectInput
                      id="depositAvailability"
                      name="depositAvailability"
                      onChange={(event) => handleTextChange("depositAvailability", event)}
                      value={values.depositAvailability}
                    >
                      <option value="">Select one</option>
                      {depositOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field error={errors.currentHousing}>
                    <FieldLabel htmlFor="currentHousing">Current housing</FieldLabel>
                    <SelectInput
                      id="currentHousing"
                      name="currentHousing"
                      onChange={(event) => handleTextChange("currentHousing", event)}
                      value={values.currentHousing}
                    >
                      <option value="">Select one</option>
                      {currentHousingOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="hasRentedBefore">Have you rented before?</FieldLabel>
                    <SelectInput
                      id="hasRentedBefore"
                      name="hasRentedBefore"
                      onChange={(event) => handleTextChange("hasRentedBefore", event)}
                      value={values.hasRentedBefore}
                    >
                      {rentedBeforeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="notes">Anything else?</FieldLabel>
                  <TextArea
                    id="notes"
                    name="notes"
                    onChange={(event) => handleTextChange("notes", event)}
                    placeholder="Move reason, viewing availability, preferred contact time, or extra context for the agent."
                    value={values.notes}
                  />
                </Field>
              </div>
            ) : null}

            {activeStep === 3 ? (
              <div className="grid gap-6">
                <div className="rounded-md border border-border bg-surface-subtle p-5">
                  <h2 className="text-lg font-semibold text-foreground">Review summary</h2>
                  <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                    <SummaryItem label="Name" value={values.fullName} />
                    <SummaryItem label="Email" value={values.email} />
                    <SummaryItem label="Phone" value={values.phone} />
                    <SummaryItem label="Areas" value={areas.join(", ")} />
                    <SummaryItem label="Bedrooms" value={formatBedrooms(values.bedroomsRequired)} />
                    <SummaryItem label="Max rent" value={formatRent(values.maxRent)} />
                    <SummaryItem
                      label="Move window"
                      value={formatMoveWindow(values.moveInFrom, values.moveInBy)}
                    />
                    <SummaryItem
                      label="Employment"
                      value={optionLabel(employmentOptions, values.employmentStatus)}
                    />
                    <SummaryItem
                      label="Deposit"
                      value={optionLabel(depositOptions, values.depositAvailability)}
                    />
                    <SummaryItem
                      label="Guarantor"
                      value={optionLabel(guarantorOptions, values.hasGuarantor)}
                    />
                  </dl>
                </div>

                <Field error={errors.consentGiven}>
                  <div className="flex gap-3 rounded-md border border-border bg-surface p-4">
                    <CheckboxInput
                      checked={values.consentGiven}
                      id="consentGiven"
                      name="consentGiven"
                      onChange={(event) => updateValue("consentGiven", event.target.checked)}
                    />
                    <span className="text-sm leading-6 text-muted">
                      <FieldLabel
                        className="inline font-semibold text-foreground"
                        htmlFor="consentGiven"
                      >
                        I consent to Proper Rent
                      </FieldLabel>{" "}
                      storing my renter enquiry, contacting me about my requirements, and
                      sharing relevant details with the human agent for follow-up. I agree to
                      the{" "}
                      <Link className="font-semibold underline" href={site.routes.privacy}>
                        Privacy Policy
                      </Link>{" "}
                      and{" "}
                      <Link className="font-semibold underline" href={site.routes.terms}>
                        Terms
                      </Link>
                      . Consent version: {CONSENT_VERSION}.
                    </span>
                  </div>
                </Field>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                className={buttonClasses({ variant: "secondary" })}
                disabled={activeStep === 0 || isSubmitting}
                onClick={goToPreviousStep}
                type="button"
              >
                Back
              </button>
              {activeStep < steps.length - 1 ? (
                <button className={buttonClasses()} onClick={goToNextStep} type="button">
                  Continue
                </button>
              ) : (
                <button className={buttonClasses()} disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Submitting..." : "Submit renter enquiry"}
                </button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function RenterIntakeSuccess({ message }: { message: string }) {
  return (
    <Card aria-live="polite" className="mx-auto max-w-3xl" role="status">
      <CardHeader>
        <p className="text-sm font-bold uppercase tracking-[0.08em] text-success">
          Enquiry received
        </p>
        <CardTitle>Thank you. Your enquiry is with the agent.</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {[
            "Our team will review your requirements and be in touch within 24 hours.",
            "A confirmation email will be sent to the email address you provided.",
            "Specific listing availability is confirmed by a human agent, not by the website.",
          ].map((item) => (
            <div className="rounded-md border border-border bg-surface-subtle p-4" key={item}>
              <p className="text-sm leading-6 text-muted">{item}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className={buttonClasses()} href={site.routes.renters}>
            Back to renters
          </Link>
          <Link className={buttonClasses({ variant: "secondary" })} href={site.routes.howItWorks}>
            What happens next
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function FormAlert({ children }: { children: string }) {
  return (
    <div
      className="mb-5 rounded-md border border-danger/30 bg-danger/10 p-4 text-sm font-medium leading-6 text-danger"
      role="alert"
    >
      {children}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-foreground">{label}</dt>
      <dd className="mt-1 text-muted">{value || "Not provided"}</dd>
    </div>
  );
}

function validateStep(values: FormValues, stepIndex: number): FormErrors {
  const allErrors = validateAll(values);
  const stepFields = new Set<FormField>(steps[stepIndex].fields);
  return Object.fromEntries(
    Object.entries(allErrors).filter(([field]) => stepFields.has(field as FormField)),
  );
}

function validateAll(values: FormValues): FormErrors {
  const nextErrors: FormErrors = {};
  const bedrooms = Number(values.bedroomsRequired);
  const maxRent = Number(values.maxRent);

  if (!values.fullName.trim()) {
    nextErrors.fullName = "Enter your full name.";
  }
  if (!isValidEmail(values.email)) {
    nextErrors.email = "Enter a valid email address.";
  }
  if (!values.phone.trim()) {
    nextErrors.phone = "Enter a phone number.";
  }
  if (!values.bedroomsRequired || !Number.isInteger(bedrooms) || bedrooms < 0 || bedrooms > 20) {
    nextErrors.bedroomsRequired = "Select the number of bedrooms required.";
  }
  if (parseAreas(values.areasPreferred).length === 0) {
    nextErrors.areasPreferred = "Enter at least one preferred area.";
  }
  if (!values.maxRent || Number.isNaN(maxRent) || maxRent <= 0) {
    nextErrors.maxRent = "Enter a monthly budget above zero.";
  }
  if (values.moveInFrom && values.moveInBy && values.moveInFrom > values.moveInBy) {
    nextErrors.moveInBy = "Latest move-in date must be after the earliest date.";
  }
  if (!values.employmentStatus) {
    nextErrors.employmentStatus = "Select your employment status.";
  }
  if (!values.hasGuarantor) {
    nextErrors.hasGuarantor = "Select whether you have a guarantor.";
  }
  if (!values.depositAvailability) {
    nextErrors.depositAvailability = "Select your deposit availability.";
  }
  if (!values.currentHousing) {
    nextErrors.currentHousing = "Select your current housing.";
  }
  if (!values.consentGiven) {
    nextErrors.consentGiven = "Consent is required before we can save your enquiry.";
  }

  return nextErrors;
}

function firstStepWithError(errors: FormErrors) {
  const errorFields = new Set(Object.keys(errors));
  const stepIndex = steps.findIndex((step) =>
    step.fields.some((field) => errorFields.has(field)),
  );
  return stepIndex === -1 ? 0 : stepIndex;
}

function buildPayload(values: FormValues, sessionId: string | null): RenterLeadRequest {
  return {
    source_channel: "website",
    session_id: sessionId,
    full_name: values.fullName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    bedrooms_required: Number(values.bedroomsRequired),
    areas_preferred: parseAreas(values.areasPreferred),
    max_rent: Number(values.maxRent),
    move_in_from: emptyToNull(values.moveInFrom),
    move_in_by: emptyToNull(values.moveInBy),
    employment_status: values.employmentStatus || "other",
    annual_income_range: emptyToNull(values.annualIncomeRange),
    has_guarantor: values.hasGuarantor || "unsure",
    deposit_availability: values.depositAvailability || "limited",
    current_housing: values.currentHousing || "renting",
    how_heard: emptyToNull(values.howHeard),
    furnished_preference: values.furnishedPreference,
    pets: emptyToNull(values.pets),
    accessibility_needs: emptyToNull(values.accessibilityNeeds),
    has_rented_before:
      values.hasRentedBefore === "" ? null : values.hasRentedBefore === "true",
    notes: emptyToNull(values.notes),
    consent_given: true,
    consent_version: CONSENT_VERSION,
  };
}

function applyQueryPrefill(current: FormValues, params: URLSearchParams): FormValues {
  return {
    ...current,
    bedroomsRequired: params.get("bedrooms") ?? current.bedroomsRequired,
    areasPreferred: params.get("areas") ?? params.get("area") ?? current.areasPreferred,
    maxRent: params.get("max_rent") ?? params.get("budget") ?? current.maxRent,
    moveInFrom: params.get("move_in_from") ?? current.moveInFrom,
    moveInBy: params.get("move_in_by") ?? current.moveInBy,
  };
}

function resolveSessionId(params: URLSearchParams): string {
  const querySessionId = params.get("session_id")?.slice(0, 128);
  if (querySessionId) {
    persistSessionId(querySessionId);
    return querySessionId;
  }

  const storedSessionId = readStoredSessionId();
  if (storedSessionId) {
    return storedSessionId;
  }

  const nextSessionId = createSessionId();
  persistSessionId(nextSessionId);
  return nextSessionId;
}

function readStoredSessionId() {
  try {
    return window.localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistSessionId(value: string) {
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, value);
  } catch {
    // Storage can be unavailable in private browsing. The in-memory state still works.
  }
}

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseAreas(value: string) {
  return value
    .split(/[,\n]/)
    .map((area) => area.trim())
    .filter(Boolean);
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function formatBedrooms(value: string) {
  if (!value) {
    return "";
  }
  if (value === "0") {
    return "Studio";
  }
  if (value === "1") {
    return "1 bedroom";
  }
  return `${value} bedrooms`;
}

function formatRent(value: string) {
  const amount = Number(value);
  if (!amount || Number.isNaN(amount)) {
    return "";
  }
  return `£${amount.toLocaleString("en-GB")} pcm`;
}

function formatMoveWindow(from: string, by: string) {
  if (from && by) {
    return `${from} to ${by}`;
  }
  if (from) {
    return `From ${from}`;
  }
  if (by) {
    return `By ${by}`;
  }
  return "";
}

function optionLabel<Option extends { value: string; label: string }>(
  options: readonly Option[],
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? "";
}
