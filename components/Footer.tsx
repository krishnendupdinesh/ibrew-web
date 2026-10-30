
"use client";

import { useState, type FormEvent } from "react";
import { Mail, Smartphone, ArrowRight } from "lucide-react";

const shopLinks = [
  { label: "Coffee Powder", href: "/shop/coffee-powder" },
  { label: "Spices", href: "/shop/spices" },
  { label: "Imported Perfumes", href: "/shop/imported-perfumes" },
  { label: "Imported Beds", href: "/shop/imported-beds" },
];

const informationLinks = [
  { label: "About Our Store", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "FAQs", href: "/faqs" },
];

const policyLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Shipping & Returns", href: "/shipping-returns" },
];

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/", symbol: "f" },
  { label: "Instagram", href: "https://www.instagram.com/", symbol: "◎" },
  { label: "YouTube", href: "https://www.youtube.com/", symbol: "▶" },
  { label: "LinkedIn", href: "https://www.linkedin.com/", symbol: "in" },
  { label: "X", href: "https://x.com/", symbol: "𝕏" },
  { label: "Pinterest", href: "https://www.pinterest.com/", symbol: "p" },
];

function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="mb-6 text-base font-bold uppercase tracking-wide sm:text-lg">
        {title}
      </h3>

      <ul className="space-y-4">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-sm text-[#fff8ef]/90 transition-colors hover:text-white hover:underline sm:text-base"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      return;
    }

    // Connect your newsletter API to save subscribers.
    setMessage(
      "Thank you for your interest in Imaan's Store! Newsletter signup needs to be connected."
    );
    setEmail("");
  }

  return (
    <footer className="bg-[#000000] text-[#fffaf3]">
      <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          {/* Store information and newsletter */}
          <div className="sm:col-span-2 lg:col-span-5">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Join Imaan&apos;s Community
            </h2>

            <p className="mt-3 max-w-md text-sm leading-6 text-[#fff8ef]/85">
              Discover rich coffee flavours, aromatic spices, exquisite
              imported perfumes, and comfortable imported beds. Subscribe to
              hear about new arrivals, special offers, and more.
            </p>

            {/* Newsletter */}
            <form
              onSubmit={handleSubscribe}
              className="mt-5 flex w-full max-w-[440px] items-stretch border border-[#e7d5c2]/80"
            >
              <label htmlFor="footer-email" className="sr-only">
                Enter your email address
              </label>

              <input
                id="footer-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email address"
                className="min-w-0 flex-1 bg-transparent px-3 py-4 text-sm text-white outline-none placeholder:text-[#fff8ef]/80 focus:bg-white/5 sm:px-4"
              />

              <button
                type="submit"
                className="flex shrink-0 items-center gap-2 px-3 text-xs font-semibold transition-colors hover:bg-white/10 sm:px-5 sm:text-sm"
              >
                SUBSCRIBE
                <ArrowRight size={16} className="hidden sm:block" />
              </button>
            </form>

            {message && (
              <p
                role="status"
                aria-live="polite"
                className="mt-3 max-w-md text-sm text-white"
              >
                {message}
              </p>
            )}

            {/* Social media */}
            <div className="mt-10">
              <h3 className="mb-4 text-xl font-semibold sm:text-2xl">
                Follow us on
              </h3>

              <div className="flex flex-wrap items-center gap-5">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-7 min-w-5 items-center justify-center text-lg font-bold text-[#fffaf3] transition-transform hover:-translate-y-1 hover:text-[#e9d2a8]"
                  >
                    {social.symbol}
                  </a>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="mt-10">
              <h3 className="mb-4 text-xl font-semibold sm:text-2xl">
                Contact Us
              </h3>

              <div className="flex flex-col gap-4 text-sm sm:text-base">
                <p className="flex items-center gap-3">
                  <Smartphone size={20} className="shrink-0" />
                  <span>Add your store phone number</span>
                </p>

                <p className="flex items-center gap-3 break-all">
                  <Mail size={20} className="shrink-0" />
                  <span>Add your store email address</span>
                </p>
              </div>
            </div>

            {/* Product highlights */}
            <div className="mt-10">
              <h3 className="mb-4 text-xl font-semibold sm:text-2xl">
                Explore Our Collection
              </h3>

              <p className="max-w-md text-sm leading-6 text-[#fff8ef]/85">
                From your favourite cup of coffee to distinctive fragrances
                and everyday essentials, find something special at
                Imaan&apos;s Store.
              </p>

              <a
                href="/shop"
                className="mt-5 inline-flex items-center gap-2 border border-[#e7d5c2]/80 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
              >
                EXPLORE OUR STORE
                <ArrowRight size={16} />
              </a>
            </div>
          </div>

          {/* Navigation columns */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:col-span-2 sm:grid-cols-3 lg:col-span-7 lg:gap-x-8">
            <FooterLinks title="Shop" links={shopLinks} />

            <FooterLinks title="Information" links={informationLinks} />

            <div className="col-span-2 sm:col-span-1">
              <FooterLinks title="Policies" links={policyLinks} />

              <div className="mt-10">
                <h3 className="mb-6 text-base font-bold uppercase tracking-wide sm:text-lg">
                  Customer Care
                </h3>

                <a
                  href="/contact"
                  className="text-sm text-[#fff8ef]/90 transition-colors hover:text-white hover:underline sm:text-base"
                >
                  Get in Touch
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Brand description */}
        <div className="mt-12 border-t border-white/20 pt-7 sm:mt-14">
          <p className="text-xs font-semibold leading-5 sm:text-sm">
            Imaan&apos;s Store — Quality for Every Lifestyle
          </p>

          <p className="mt-2 max-w-6xl text-xs leading-5 text-[#fff8ef]/85 sm:text-sm">
            Imaan&apos;s Store brings together coffee powder, flavourful
            spices, imported perfumes, and imported beds in one convenient
            destination. Explore a collection that combines everyday
            essentials with distinctive finds for your home and lifestyle.
          </p>

          {/* Copyright */}
          <div className="mt-6 flex flex-col gap-3 border-t border-white/20 pt-5 text-xs text-[#fff8ef]/75 sm:flex-row sm:items-center sm:justify-between">
            <p>
© 2026 Imaan&apos;s Store. All rights reserved.              reserved.
            </p>

            <a
              href="/privacy-policy"
              className="w-fit transition-colors hover:text-white hover:underline"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
