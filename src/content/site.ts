/** Single edit point for brand, nav, footer and checkout links. */
export const site = {
  name: "Brain Map",
  short: "b.m",
  creator: "creativebee.app",
  creatorUrl: "https://creativebee.app",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://brainmap.example",
  description:
    "Printable planners and Brain Map OS — a private, encrypted second brain to track your habits, goals, money and life in one place.",
  email: "support@creativebee.app",
  phone: "9988440766",
  phoneDisplay: "+91 99884 40766",
  phoneHref: "tel:+919988440766",
  announcements: [
    "ONE MONTH CAN CHANGE EVERYTHING",
    "INSTANT ACCESS · PRINT IT · USE IT TODAY",
    "NEW: BRAIN MAP OS — YOUR PRIVATE SECOND BRAIN",
  ],
  nav: [
    { label: "Home", href: "/" },
    { label: "Habit Tracker", href: "/products/habit" },
    { label: "Brain Map OS", href: "/products/second-brain" },
    { label: "Bundle", href: "/products/bundle" },
    { label: "Contact Us", href: "/pages/contact" },
  ],
  footerLinks: [
    { label: "Habit Tracker", href: "/products/habit" },
    { label: "Brain Map OS", href: "/products/second-brain" },
    { label: "Bundle", href: "/products/bundle" },
    { label: "Contact Us", href: "/pages/contact" },
    { label: "Privacy Policy", href: "/policies/privacy" },
    { label: "Shipping Policy", href: "/policies/shipping" },
    { label: "Return Policy", href: "/policies/returns" },
    { label: "Terms Of Service", href: "/policies/terms" },
  ],
} as const;

/**
 * Checkout links. Replace each "#" with the real payment link (Razorpay, Shopify, Gumroad…).
 * Until then the buttons open the demo checkout (simulated payment).
 */
export const CHECKOUT = {
  "habit-full": "#",
  "second-brain": "#",
  "bundle": "#",
} as const;

export type CheckoutKey = keyof typeof CHECKOUT;
