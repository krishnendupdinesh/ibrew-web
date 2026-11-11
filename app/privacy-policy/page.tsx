"use client";

import Link from "next/link";
import { Ubuntu } from "next/font/google";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export default function PrivacyPolicyPage() {
  return (
    <div className={`${ubuntu.className} min-h-screen bg-[#FAF7F2] text-[#1F1A17]`}>
      <section className="border-b border-[#E9DCC6] bg-[#F5EDE0] py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[#7A5A3C]">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <span>/</span>
            <span>Privacy Policy</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#1F1A17] sm:text-4xl">
            Privacy Policy &amp; Terms of Service
          </h1>
          <p className="mt-2 text-sm text-[#1F1A17]/70">
            Last updated: November 2026 · Imaan&apos;s Artisanal Products Pvt. Ltd.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8 rounded-2xl border border-[#E9DCC6] bg-white p-6 shadow-xs sm:p-10">
          <div className="flex items-center gap-3 rounded-xl bg-[#FAF3E8] p-4 text-[#7A5A3C]">
            <ShieldCheck className="h-6 w-6 shrink-0" />
            <p className="text-xs font-medium leading-relaxed sm:text-sm">
              At Imaan&apos;s Store, we value your trust and are committed to protecting your personal
              information while delivering freshly roasted coffee, spices, and lifestyle essentials.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1F1A17]">1. Information We Collect</h2>
            <p className="text-sm leading-relaxed text-[#1F1A17]/80">
              When you register an account, place an order, or request a bulk quotation, we collect
              essential contact and fulfillment details including your full name, email address,
              phone number, shipping address, and PIN code. Payment transactions processed via UPI or
              cards are handled through encrypted payment gateways and we do not store your raw card
              credentials on our servers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1F1A17]">2. How We Use Your Information</h2>
            <p className="text-sm leading-relaxed text-[#1F1A17]/80">
              We use your information exclusively to confirm and pack your orders, provide courier
              AWB dispatch tracking, generate GST-compliant tax invoices, process order cancellations
              or refunds, and respond to customer care inquiries.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1F1A17]">3. Order Cancellation &amp; Refunds</h2>
            <p className="text-sm leading-relaxed text-[#1F1A17]/80">
              Orders can be cancelled directly from the <strong>My Orders</strong> page while they
              are in <em>Pending Confirmation</em> or <em>Order Confirmed</em> status prior to
              warehouse dispatch. Upon cancellation, reserved product stock is immediately restored.
              For prepaid orders, refunds are initiated automatically and credited within 5–7
              business days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1F1A17]">4. Data Security &amp; Contact</h2>
            <p className="text-sm leading-relaxed text-[#1F1A17]/80">
              We implement strict access controls and encrypted sessions to safeguard your account.
              If you have any questions regarding your privacy or orders, please reach out to us at{" "}
              <a href="mailto:imaanstrading@gmail.com" className="font-semibold text-[#7A5A3C] underline">
                imaanstrading@gmail.com
              </a>{" "}
              or call{" "}
              <a href="tel:+919876543210" className="font-semibold text-[#7A5A3C] underline">
                +91 98765 43210
              </a>
              .
            </p>
          </section>

          <div className="border-t border-[#E9DCC6] pt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-[#7A5A3C] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#1F1A17]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Store</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

