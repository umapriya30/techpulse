import type { Metadata } from "next";
import { Suspense } from "react";
import { SubmitForm } from "@/components/submit-form";

export const metadata: Metadata = {
  title: "Submit an Event or Hackathon",
  description:
    "Organisers can submit a tech event or hackathon for review. Our team verifies listings before publication.",
};

export default function SubmitPage() {
  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Submit an Event or Hackathon
      </h1>
      <p className="mt-2 text-text-muted">
        Tell us about your event. Submissions are reviewed by our team and marked{" "}
        <strong>Pending verification</strong> until approved — we never publish
        unverified dates, prices or links.
      </p>
      <Suspense fallback={<div className="mt-8 h-96 rounded-2xl skeleton" />}>
        <SubmitForm />
      </Suspense>
    </div>
  );
}
