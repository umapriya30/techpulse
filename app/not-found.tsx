import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-6xl font-black text-gradient">404</p>
      <h1 className="mt-4 text-2xl font-bold">This page has moved on</h1>
      <p className="mt-2 max-w-sm text-text-muted">
        The article, event or hackathon you&apos;re looking for isn&apos;t here.
        It may have been removed or the link may be out of date.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Back to home</ButtonLink>
        <ButtonLink href="/search" variant="outline">
          Search TechPulse
        </ButtonLink>
      </div>
    </div>
  );
}
