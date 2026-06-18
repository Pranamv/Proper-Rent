"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useState } from "react";

import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckboxInput,
  Field,
  FieldHint,
  FieldLabel,
  TextArea,
  TextInput,
} from "@/components/ui/field";
import { ApiError, publicApi } from "@/lib/api";
import type { LandlordIntakeRequest, LandlordIntakeResponse } from "@/lib/api";
import { CONSENT_VERSION, consentCopy } from "@/lib/consent";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Contact details",
    description: "These details are saved under consent and used for agent follow-up.",
    fields: ["fullName", "email", "phone"] as const,
  },
  {
    title: "Property details",
    description: "Share enough information for the agent to assess listing and Advanced Rent next steps.",
    fields: ["propertyAddress", "bedrooms", "askingRent"] as const,
  },
  {
    title: "Consent",
    description: "Last step. Review your details, then send this to an agent.",
    fields: ["consentGiven"] as const,
  },
] as const;

type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  propertyAddress: string;
  bedrooms: string;
  askingRent: string;
  availableFrom: string;
  advancedRentInterest: boolean;
  listingInterest: boolean;
  notes: string;
  consentGiven: boolean;
};

type FormField = keyof FormValues;
type FormErrors = Partial<Record<FormField, string>>;

const initialValues: FormValues = {
  fullName: "",
  email: "",
  phone: "",
  propertyAddress: "",
  bedrooms: "",
  askingRent: "",
  availableFrom: "",
  advancedRentInterest: false,
  listingInterest: false,
  notes: "",
  consentGiven: false,
};

export function LandlordIntakeForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<LandlordIntakeResponse | null>(null);

  const progressLabel = `Step ${activeStep + 1} of ${steps.length}`;
  const currentStep = steps[activeStep];

  function updateValue<FieldName extends FormField>(
    field: FieldName,
    value: FormValues[FieldName],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  }

  function handleTextChange(
    field: Exclude<
      FormField,
      "advancedRentInterest" | "listingInterest" | "consentGiven"
    >,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
      const response = await publicApi.createLandlordIntake(buildPayload(values));
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
    return <LandlordIntakeSuccess message={success.message} />;
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
              </div>
            ) : null}

            {activeStep === 1 ? (
              <div className="grid gap-5">
                <Field error={errors.propertyAddress}>
                  <FieldLabel htmlFor="propertyAddress">Property address</FieldLabel>
                  <TextArea
                    autoComplete="street-address"
                    id="propertyAddress"
                    maxLength={500}
                    name="propertyAddress"
                    onChange={(event) => handleTextChange("propertyAddress", event)}
                    placeholder="Flat, street, town or city, postcode if available"
                    value={values.propertyAddress}
                  />
                </Field>
                <div className="grid gap-5 md:grid-cols-3">
                  <Field error={errors.bedrooms}>
                    <FieldLabel htmlFor="bedrooms">Bedrooms</FieldLabel>
                    <TextInput
                      id="bedrooms"
                      inputMode="numeric"
                      max="50"
                      min="0"
                      name="bedrooms"
                      onChange={(event) => handleTextChange("bedrooms", event)}
                      placeholder="2"
                      type="number"
                      value={values.bedrooms}
                    />
                    <FieldHint>Use 0 for a studio.</FieldHint>
                  </Field>
                  <Field error={errors.askingRent}>
                    <FieldLabel htmlFor="askingRent">Asking rent</FieldLabel>
                    <TextInput
                      id="askingRent"
                      inputMode="numeric"
                      min="1"
                      name="askingRent"
                      onChange={(event) => handleTextChange("askingRent", event)}
                      placeholder="1400"
                      type="number"
                      value={values.askingRent}
                    />
                    <FieldHint>Monthly rent in GBP.</FieldHint>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="availableFrom">Available from</FieldLabel>
                    <TextInput
                      id="availableFrom"
                      name="availableFrom"
                      onChange={(event) => handleTextChange("availableFrom", event)}
                      type="date"
                      value={values.availableFrom}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <InterestCheckbox
                    checked={values.listingInterest}
                    description="I want to discuss listing this property through the Proper Rent / Scraye process."
                    id="listingInterest"
                    label="Listing interest"
                    onChange={(checked) => updateValue("listingInterest", checked)}
                  />
                  <InterestCheckbox
                    checked={values.advancedRentInterest}
                    description="I want to discuss Advanced Rent options for receiving rent upfront."
                    id="advancedRentInterest"
                    label="Advanced Rent interest"
                    onChange={(checked) => updateValue("advancedRentInterest", checked)}
                  />
                </div>
                <Field>
                  <FieldLabel htmlFor="notes">Anything else?</FieldLabel>
                  <TextArea
                    id="notes"
                    maxLength={2000}
                    name="notes"
                    onChange={(event) => handleTextChange("notes", event)}
                    placeholder="Current vacancy status, tenant timing, preferred contact time, or other useful context."
                    value={values.notes}
                  />
                </Field>
              </div>
            ) : null}

            {activeStep === 2 ? (
              <div className="grid gap-5">
                <details className="rounded-md border border-border bg-surface-subtle p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">
                    Check your answers
                  </summary>
                  <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                    <SummaryItem label="Name" value={values.fullName} />
                    <SummaryItem label="Email" value={values.email} />
                    <SummaryItem label="Phone" value={values.phone} />
                    <SummaryItem label="Property address" value={values.propertyAddress} />
                    <SummaryItem label="Bedrooms" value={formatBedrooms(values.bedrooms)} />
                    <SummaryItem label="Asking rent" value={formatRent(values.askingRent)} />
                    <SummaryItem label="Available from" value={values.availableFrom} />
                    <SummaryItem
                      label="Listing interest"
                      value={values.listingInterest ? "Yes" : "No"}
                    />
                    <SummaryItem
                      label="Advanced Rent interest"
                      value={values.advancedRentInterest ? "Yes" : "No"}
                    />
                  </dl>
                </details>

                <Field error={errors.consentGiven}>
                  <div className="flex gap-3 rounded-md border border-border bg-surface p-4">
                    <CheckboxInput
                      checked={values.consentGiven}
                      id="consentGiven"
                      name="consentGiven"
                      onChange={(event) => updateValue("consentGiven", event.target.checked)}
                    />
                    <div className="text-sm leading-6 text-muted">
                      <FieldLabel
                        className="inline font-semibold text-foreground"
                        htmlFor="consentGiven"
                      >
                        I agree to be contacted about this property
                      </FieldLabel>{" "}
                      and for it to be shared with the Proper Rent agent.{" "}
                      <details className="mt-1">
                        <summary className="cursor-pointer font-semibold text-foreground underline">
                          Read full details
                        </summary>
                        <p className="mt-2">
                          {consentCopy.landlord} I agree to the{" "}
                          <Link className="font-semibold underline" href={site.routes.privacy}>
                            Privacy Policy
                          </Link>{" "}
                          and{" "}
                          <Link className="font-semibold underline" href={site.routes.terms}>
                            Terms
                          </Link>
                          . Consent version: {CONSENT_VERSION}.
                        </p>
                      </details>
                    </div>
                  </div>
                </Field>
                <p className="text-sm leading-6 text-muted">
                  Your details go to one human agent. They are never sold or shared with
                  third parties.
                </p>
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
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <button className={buttonClasses()} disabled={isSubmitting} type="submit">
                    {isSubmitting ? "Sending..." : "Send to an agent"}
                  </button>
                  <p className="text-sm text-muted">An agent reviews within 24 hours.</p>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function InterestCheckbox({
  checked,
  description,
  id,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  id: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex gap-3 rounded-md border border-border bg-surface-subtle p-4">
      <CheckboxInput
        checked={checked}
        id={id}
        name={id}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <FieldLabel className="inline" htmlFor={id}>
          {label}
        </FieldLabel>
        <span className="mt-1 block text-sm leading-6 text-muted">{description}</span>
      </span>
    </div>
  );
}

function LandlordIntakeSuccess({ message }: { message: string }) {
  return (
    <Card aria-live="polite" className="mx-auto max-w-3xl" role="status">
      <CardHeader>
        <p className="text-sm font-bold uppercase tracking-[0.08em] text-success">
          Enquiry received
        </p>
        <CardTitle>Thank you. Your property details are with the agent.</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {[
            "A confirmation email will be sent to the email address you provided.",
            "An agent will review the property details and follow up on listing or Advanced Rent next steps.",
            "Landlord enquiries are not scored in Phase 1; every successful submission reaches the agent.",
          ].map((item) => (
            <div className="rounded-md border border-border bg-surface-subtle p-4" key={item}>
              <p className="text-sm leading-6 text-muted">{item}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className={buttonClasses()} href={site.routes.landlords}>
            Back to landlords
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

function firstStepWithError(errors: FormErrors) {
  const errorFields = new Set(Object.keys(errors));
  const stepIndex = steps.findIndex((step) =>
    step.fields.some((field) => errorFields.has(field)),
  );
  return stepIndex === -1 ? 0 : stepIndex;
}

function validateAll(values: FormValues): FormErrors {
  const nextErrors: FormErrors = {};
  const bedrooms = Number(values.bedrooms);
  const askingRent = Number(values.askingRent);

  if (!values.fullName.trim()) {
    nextErrors.fullName = "Enter your full name.";
  }
  if (!isValidEmail(values.email)) {
    nextErrors.email = "Enter a valid email address.";
  }
  if (!values.phone.trim()) {
    nextErrors.phone = "Enter a phone number.";
  }
  if (!values.propertyAddress.trim()) {
    nextErrors.propertyAddress = "Enter the property address.";
  }
  if (!values.bedrooms || !Number.isInteger(bedrooms) || bedrooms < 0 || bedrooms > 50) {
    nextErrors.bedrooms = "Enter a bedroom count between 0 and 50.";
  }
  if (!values.askingRent || Number.isNaN(askingRent) || askingRent <= 0) {
    nextErrors.askingRent = "Enter a monthly asking rent above zero.";
  }
  if (!values.consentGiven) {
    nextErrors.consentGiven = "Consent is required before we can save your enquiry.";
  }

  return nextErrors;
}

function buildPayload(values: FormValues): LandlordIntakeRequest {
  return {
    full_name: values.fullName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    property_address: values.propertyAddress.trim(),
    bedrooms: Number(values.bedrooms),
    asking_rent: Number(values.askingRent),
    available_from: emptyToNull(values.availableFrom),
    advanced_rent_interest: values.advancedRentInterest,
    listing_interest: values.listingInterest,
    notes: emptyToNull(values.notes),
    consent_given: true,
    consent_version: CONSENT_VERSION,
  };
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
