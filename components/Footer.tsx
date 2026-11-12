"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail, Smartphone, ArrowRight, MapPin, Clock } from "lucide-react";

const shopLinks = [
  { label: "Coffee", href: "/coffee" },
  { label: "Skincare", href: "/coffee-skin" },
  { label: "Spices", href: "/spices" },
  { label: "Fragrances", href: "/fragrances" },
  { label: "Imported Mattresses", href: "/importedbed" },
  { label: "Groceries", href: "/groceries" },
  { label: "Dates", href: "/dates" },
];

const informationLinks = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "All Products", href: "/search" },
  { label: "Bulk / Wholesale", href: "/bulk-order" },
  { label: "Track My Orders", href: "/orders" },
  { label: "My Wishlist", href: "/wishlist" },
];

const policyLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Refund & Cancellation", href: "/refund-cancellation" },
  { label: "Shipping & Delivery", href: "/shipping-returns" },
];

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/", symbol: "f" },
  { label: "Instagram", href: "https://www.instagram.com/", symbol: "◎" },
  { label: "YouTube", href: "https://www.youtube.com/", symbol: "▶" },
  { label: "X", href: "https://x.com/", symbol: "𝕏" },
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

      <ul className="space-y-3.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-[#fff8ef]/90 transition-colors hover:text-white hover:underline sm:text-base"
            >
              {link.label}
            </Link>
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

    setMessage(
      "Thank you for subscribing to Imaan's Store! You'll receive updates on new arrivals and exclusive offers."
    );
    setEmail("");
  }

  return (
    <footer className="bg-[#000000] text-[#fffaf3]">
      <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          
          {/* Store information, newsletter & address */}
          <div className="sm:col-span-2 lg:col-span-5">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Join Imaan&apos;s Community
            </h2>

            <p className="mt-3 max-w-md text-sm leading-6 text-[#fff8ef]/85">
              Discover rich coffee flavours, aromatic spices, exquisite
              imported perfumes, and comfortable imported mattresses. Subscribe to
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

            {/* Physical Store Address Section */}
            <div className="mt-10 rounded-xl border border-white/15 bg-white/[0.04] p-5">
              <h3 className="flex items-center gap-2 text-base font-bold uppercase tracking-wide text-[#e9d2a8] sm:text-lg">
                <MapPin size={20} className="shrink-0 text-[#e9d2a8]" />
                Physical Store &amp; Office
              </h3>
              <div className="mt-3 text-sm leading-6 text-[#fff8ef]/90">
                <p className="font-semibold text-white">Imaan&apos;s Artisanal Products Pvt. Ltd.</p>
                <p>Estate Road, Madikeri</p>
                <p>Coorg, Karnataka - 571201, India</p>
                <p className="mt-2 flex items-center gap-2 text-xs text-[#fff8ef]/70">
                  <Clock size={14} className="shrink-0" />
                  Mon – Sat: 9:00 AM – 7:30 PM IST
                </p>
              </div>
            </div>

            {/* Contact & Social media */}
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#e9d2a8]">
                  Contact Us
                </h4>
                <div className="flex flex-col gap-2.5 text-sm">
                  <a
                    href="tel:+919876543210"
                    className="flex items-center gap-2 transition-colors hover:text-[#e9d2a8]"
                  >
                    <Smartphone size={16} className="shrink-0 text-[#e9d2a8]" />
                    <span>+91 98765 43210</span>
                  </a>

                  <a
                    href="mailto:imaanstrading@gmail.com"
                    className="flex items-center gap-2 break-all transition-colors hover:text-[#e9d2a8]"
                  >
                    <Mail size={16} className="shrink-0 text-[#e9d2a8]" />
                    <span>imaanstrading@gmail.com</span>
                  </a>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#e9d2a8]">
                  Follow Us
                </h4>
                <div className="flex flex-wrap items-center gap-4">
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
            </div>
          </div>

          {/* Navigation columns */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:col-span-2 sm:grid-cols-3 lg:col-span-7 lg:gap-x-8">
            <FooterLinks title="Shop" links={shopLinks} />

            <FooterLinks title="Information" links={informationLinks} />

            <div className="col-span-2 sm:col-span-1">
              <FooterLinks title="Policies" links={policyLinks} />

              <div className="mt-10">
                <h3 className="mb-4 text-base font-bold uppercase tracking-wide sm:text-lg">
                  Customer Care
                </h3>

                <p className="mb-3 text-xs leading-relaxed text-[#fff8ef]/80">
                  Have a question about an order or our store? Chat with our team in Coorg directly on WhatsApp:
                </p>

                <a
                  href="https://wa.me/7907217317"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#e7d5c2]/80 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                >
                  WhatsApp Support
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Brand description & Razorpay Compliance */}
        <div className="mt-12 border-t border-white/20 pt-7 sm:mt-14">
          <p className="text-xs font-semibold leading-5 sm:text-sm">
            Imaan&apos;s Store — Quality for Every Lifestyle
          </p>

          <p className="mt-2 max-w-6xl text-xs leading-5 text-[#fff8ef]/85 sm:text-sm">
            Operated by <strong>Imaan&apos;s Artisanal Products Pvt. Ltd.</strong>, Estate Road, Madikeri, Coorg, Karnataka - 571201. 
            Bringing together estate-roasted coffee, rich spices, authentic imported perfumes, dates, and orthopedic mattresses in one convenient destination.
          </p>

          {/* Copyright & Policy quick bar */}
          <div className="mt-6 flex flex-col gap-3 border-t border-white/20 pt-5 text-xs text-[#fff8ef]/75 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © 2026 Imaan&apos;s Artisanal Products Pvt. Ltd. All rights reserved.
            </p>

            <div className="flex flex-wrap gap-4 text-xs">
              <Link
                href="/about"
                className="transition-colors hover:text-white hover:underline"
              >
                About Us
              </Link>
              <span>·</span>
              <Link
                href="/contact"
                className="transition-colors hover:text-white hover:underline"
              >
                Contact Us
              </Link>
              <span>·</span>
              <Link
                href="/privacy-policy"
                className="transition-colors hover:text-white hover:underline"
              >
                Privacy Policy
              </Link>
              <span>·</span>
              <Link
                href="/terms"
                className="transition-colors hover:text-white hover:underline"
              >
                Terms &amp; Conditions
              </Link>
              <span>·</span>
              <Link
                href="/refund-cancellation"
                className="transition-colors hover:text-white hover:underline"
              >
                Refund Policy
              </Link>
              <span>·</span>
              <Link
                href="/shipping-returns"
                className="transition-colors hover:text-white hover:underline"
              >
                Shipping Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
