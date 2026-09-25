import type { CheckoutKey } from "./site";

export type Variant = {
  id: CheckoutKey;
  label: string;
  sub: string;
  price: number;
  mrp: number;
  image: string;
  badge?: string;
};

export type Product = {
  slug: string;
  href: string;
  name: string;
  kind: "template" | "app" | "bundle";
  tagline: string;
  image: string;
  variants: Variant[];
};

export const inr = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;
export const savePct = (price: number, mrp: number) => Math.round((1 - price / mrp) * 100);

export const habit: Product = {
  slug: "habit",
  href: "/products/habit",
  name: "Brain Map Habit Tracker",
  kind: "template",
  tagline: "Build consistency. Eliminate excuses.",
  image: "/images/habit-main.png",
  variants: [
    {
      id: "habit-full",
      label: "Full Planning System",
      sub: "Monthly Template + 20+ New Templates",
      price: 399,
      mrp: 999,
      image: "/images/variant-full.webp",
      badge: "Everyone's grabbing this!",
    },
  ],
};

export const secondBrain: Product = {
  slug: "second-brain",
  href: "/products/second-brain",
  name: "Brain Map OS",
  kind: "app",
  tagline: "Replace 10+ apps with one private system.",
  image: "/images/app-hero.svg",
  variants: [
    {
      id: "second-brain",
      label: "Lifetime Access",
      sub: "Your own login · encrypted cloud sync",
      price: 299,
      mrp: 999,
      image: "/images/app-hero.svg",
    },
  ],
};

export const bundle: Product = {
  slug: "bundle",
  href: "/products/bundle",
  name: "The Brain Map Bundle",
  kind: "bundle",
  tagline: "Paper on your wall. Brain in your pocket.",
  image: "/images/bundle.jpg",
  variants: [
    {
      id: "bundle",
      label: "Full Planning System + Brain Map OS",
      sub: "20+ printable templates and lifetime app access",
      price: 499,
      mrp: 1998,
      image: "/images/bundle.jpg",
      badge: "Best value",
    },
  ],
};

export const catalog: Product[] = [habit, secondBrain, bundle];

export const planningTemplates = [
  "Habit Tracker 2.0", "Goal Setting Planner", "Habit Tracker Wheel", "Weekly Meal Planner",
  "Daily Planning", "Weekly Study Planner", "Weekly Planning", "Weekly Planner 2.0",
  "Monthly Planning", "Task Tracker", "Monthly Calendar", "Reading Tracker",
  "Monthly Budget", "Social Media Planner", "Savings Tracker", "Weight Tracker",
  "Savings Challenge", "Workout Tracker", "100 Day Challenge", "Weekly Workout",
];

export const testimonials = [
  {
    name: "Aditya",
    image: "/images/review-1.webp",
    text: "This tracker made me see everything around me: sleep, meals, water, training days, recovery, not skipping the boring stuff. I started in full focus mode and gained 4kg in my first month. Not magic, not some fake shortcut. If you’re trying to grow and keep messing around with random plans, stop guessing. Follow the process.",
  },
  {
    name: "Devansh",
    image: "/images/review-2.webp",
    text: "First few days were rough, but marking the habits made me feel connected to myself again. Like I was finally building some control back. I’m looking for goals again, and that’s massive for me. Habits are the base. No doubt.",
  },
  {
    name: "Ayesha",
    image: "/images/review-3.webp",
    text: "Found this tracker, read a few comments, and gave it a try. Now I feel stronger, clearer and way more in control. I learned to say no to what drains me. Best decision I made for myself.",
  },
];

export const quickQuotes = [
  { name: "Karthik", text: "I like having something physical in front of me. Marking each day makes me aware of what I actually do, not what I plan to do. It’s quiet, but effective." },
  { name: "Rohit", text: "I use it for training and work habits. Seeing everything mapped out helps me avoid overthinking my days." },
  { name: "Akshay", text: "I stopped using apps because they added noise. This calendar gives me one clear system for the month and nothing else." },
];
