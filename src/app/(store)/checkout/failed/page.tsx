import type { Metadata } from "next";
import { Container } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Payment not completed", robots: { index: false } };

export default async function FailedPage({ searchParams }: PageProps<"/checkout/failed">) {
  const sp = await searchParams;
  const reason = typeof sp.reason === "string" && sp.reason.length < 200 ? sp.reason : "";
  const txn = typeof sp.txn === "string" && /^[A-Za-z0-9]{6,40}$/.test(sp.txn) ? sp.txn : "";
  return (
    <Container className="max-w-xl py-20 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-alert/10 text-4xl text-alert">✕</div>
      <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight">Payment not completed</h1>
      <p className="mt-3 text-ink/70">{reason && reason !== "invalid" && reason !== "unknown" ? reason : "Your payment didn’t go through, and you haven’t been charged."}</p>
      <p className="mt-2 text-sm text-ink/55">If money was deducted, it is refunded automatically by your bank/UPI app, or contact <a className="link-grow font-semibold" href={`mailto:${site.email}`}>{site.email}</a>{txn ? <> with reference <b>{txn}</b></> : null}.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/collections/all" size="lg">Try again</ButtonLink>
        <ButtonLink href="/" variant="outline" size="lg">Back to store</ButtonLink>
      </div>
    </Container>
  );
}
