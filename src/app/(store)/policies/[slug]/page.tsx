import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Section";
import { site } from "@/content/site";

const policies: Record<string, { title: string; body: string[] }> = {
  privacy: {
    title: "Privacy Policy",
    body: [
      "We collect only what we need to deliver your purchase: your name, email and order details.",
      "Brain Map OS: the information you enter in the app is encrypted on your device before it is synced. We store only ciphertext and cannot read it. We cannot recover your data if you lose both your password and your recovery code.",
      "We never sell your personal information. Payment details are handled by our payment provider and never stored by us.",
      `Questions? Write to ${site.email}.`,
    ],
  },
  shipping: {
    title: "Shipping Policy",
    body: [
      "All Brain Map products are digital. There is no physical shipping.",
      "Printable templates are available to download from My Purchases immediately after payment. Brain Map OS logins and the app link are shown in the same place.",
      `If you don't see your purchase within a few minutes, write to ${site.email}.`,
    ],
  },
  returns: {
    title: "Return Policy",
    body: [
      "Because our products are digital and delivered instantly, they are non-refundable.",
      "If you experience any issue with a download or a login, we provide immediate support until everything works correctly.",
      `Contact ${site.email} and include your order email.`,
    ],
  },
  terms: {
    title: "Terms Of Service",
    body: [
      "By purchasing you receive a personal, non-transferable licence to use the templates and the app.",
      "You may print templates for personal use. Resale, redistribution or sharing of files or logins is not permitted.",
      "Brain Map OS is a productivity tool and does not provide financial, medical or legal advice.",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: policies[slug]?.title ?? "Policy" };
}

export default async function PolicyPage({ params }: PageProps<"/policies/[slug]">) {
  const { slug } = await params;
  const p = policies[slug];
  if (!p) notFound();
  return (
    <Container className="max-w-3xl py-16">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">{p.title}</h1>
      <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-ink/80">
        {p.body.map((t) => <p key={t}>{t}</p>)}
      </div>
    </Container>
  );
}
