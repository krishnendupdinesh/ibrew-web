"use client";

import Link from "next/link";
import { Ubuntu } from "next/font/google";
import { RotateCcw, AlertTriangle, Clock, CreditCard, CheckCircle2, ShieldCheck, HelpCircle } from "lucide-react";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export default function RefundAndCancellationPage() {
  return (
    <div className={`${ubuntu.className} min-h-screen bg-[#FAF7F2] text-[#1F1A17]`}>
      {/* Header Banner */}
      <section className="border-b border-[#E9DCC6] bg-[#F5EDE0] py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7A5A3C]">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <span>/</span>
            <span>Customer Care</span>
            <span>/</span>
            <span>Refund &amp; Cancellation</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#1F1A17] sm:text-4xl md:text-5xl">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="mt-3 text-sm text-[#1F1A17]/75 sm:text-base">
            Transparent, customer-friendly policies for cancellations, replacements, and refunds.
          </p>
          <p className="mt-1 text-xs text-[#1F1A17]/60">
            Last Updated: November 2026 · Imaan&apos;s Artisanal Products Pvt. Ltd.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8 rounded-2xl border border-[#E9DCC6] bg-white p-6 shadow-xs sm:p-10">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-[#FAF3E8] p-4 text-[#7A5A3C]">
              <Clock className="h-5 w-5 shrink-0 text-[#7A5A3C]" />
              <h4 className="mt-2 text-sm font-bold text-[#1F1A17]">Pre-Dispatch Cancellation</h4>
              <p className="mt-1 text-xs text-[#1F1A17]/70">
                100% full refund if cancelled before courier pickup (usually within 12-24 hours).
              </p>
            </div>

            <div className="rounded-xl bg-[#FAF3E8] p-4 text-[#7A5A3C]">
              <RotateCcw className="h-5 w-5 shrink-0 text-[#7A5A3C]" />
              <h4 className="mt-2 text-sm font-bold text-[#1F1A17]">7-Day Return Window</h4>
              <p className="mt-1 text-xs text-[#1F1A17]/70">
                Eligible for replacement or refund if received damaged, leaking, or defective.
              </p>
            </div>

            <div className="rounded-xl bg-[#FAF3E8] p-4 text-[#7A5A3C]">
              <CreditCard className="h-5 w-5 shrink-0 text-[#7A5A3C]" />
              <h4 className="mt-2 text-sm font-bold text-[#1F1A17]">5-7 Working Days</h4>
              <p className="mt-1 text-xs text-[#1F1A17]/70">
                Speedy refund turnaround directly back to your original source (UPI, Card, Bank).
              </p>
            </div>
          </div>

          {/* Section 1: Order Cancellation Policy */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#1F1A17]">1. Order Cancellation Policy</h2>
            <div className="space-y-2 text-sm leading-relaxed text-[#1F1A17]/80">
              <p>
                <strong>Before Dispatch:</strong> You can cancel your order anytime before it leaves our facility. 
                Simply go to your <Link href="/orders" className="text-[#7A5A3C] underline">Orders page</Link> and click 
                &ldquo;Cancel Order&rdquo;, or message our WhatsApp helpline at <strong>+91 79072 17317</strong> with your Order ID. 
                Upon cancellation before dispatch, a full 100% refund will be processed immediately.
              </p>
              <p>
                <strong>After Dispatch:</strong> Once your order has been dispatched and handed to our courier partner (an AWB tracking number is generated), 
                the order cannot be cancelled in transit. If you no longer want the package, you may reject the parcel upon delivery attempt by the courier.
              </p>
            </div>
          </section>

          {/* Section 2: Returns & Eligibility */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#1F1A17]">2. Return &amp; Replacement Eligibility</h2>
            <div className="space-y-2 text-sm leading-relaxed text-[#1F1A17]/80">
              <p>
                We take immense pride in our artisanal coffees, whole spices, premium dates, and lifestyle items. 
                However, if you experience any issue, you can request a return or free replacement within <strong>7 days</strong> of delivery under the following conditions:
              </p>
              <ul className="list-inside list-disc space-y-1.5 pl-2 text-sm text-[#1F1A17]/80">
                <li>The item was received physically damaged, broken, or leaking during transit.</li>
                <li>The wrong product, size, or grind level was delivered compared to your order invoice.</li>
                <li>The product has expired or suffers from manufacturing seal defects.</li>
                <li>For imported mattresses: must be unused, unsoiled, and in the original packaging.</li>
              </ul>
              <div className="rounded-lg border border-[#E9DCC6] bg-[#FAF7F2] p-4 text-xs text-[#1F1A17]/75">
                <strong className="text-[#1F1A17]">Non-Returnable Items:</strong> Perishable or consumable food items (such as opened coffee bags or unsealed dates) 
                cannot be returned for hygiene and food safety reasons once opened, unless verified as defective or spoilt upon arrival.
              </div>
            </div>
          </section>

          {/* Section 3: How to Initiate a Return or Refund */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#1F1A17]">3. How to Request a Return or Refund</h2>
            <div className="space-y-3 text-sm leading-relaxed text-[#1F1A17]/80">
              <ol className="list-inside list-decimal space-y-2 pl-2">
                <li>
                  Take a clear photo or short unboxing video showing the damaged package or defective item with the shipping label visible.
                </li>
                <li>
                  Email us at <a href="mailto:imaanstrading@gmail.com" className="text-[#7A5A3C] underline">imaanstrading@gmail.com</a> or 
                  send a WhatsApp message to <a href="https://wa.me/7907217317" className="text-[#7A5A3C] underline">+91 79072 17317</a>.
                </li>
                <li>
                  Include your <strong>Order ID</strong>, registered phone number, and a brief description of the issue.
                </li>
                <li>
                  Our customer care team will review your request within <strong>24 business hours</strong> and schedule a reverse courier pickup or immediately approve a replacement/refund.
                </li>
              </ol>
            </div>
          </section>

          {/* Section 4: Refund Process & Timelines */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#1F1A17]">4. Refund Process &amp; Timelines</h2>
            <div className="space-y-2 text-sm leading-relaxed text-[#1F1A17]/80">
              <p>
                Once your return is inspected and approved (or cancellation confirmed):
              </p>
              <ul className="list-inside list-disc space-y-1.5 pl-2 text-sm text-[#1F1A17]/80">
                <li>
                  <strong>Prepaid Orders (UPI, Cards, Net Banking via Razorpay):</strong> The refund amount will be credited directly back to the original bank account or card used during checkout within <strong>5 to 7 working days</strong>.
                </li>
                <li>
                  <strong>Cash on Delivery (COD) Orders:</strong> If you paid via COD, our support team will request your UPI ID or Bank Account Details (Account Number + IFSC Code) and transfer the refund directly via NEFT/IMPS within <strong>3 to 5 business days</strong>.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 5: Contact Information */}
          <section className="rounded-xl border border-[#E9DCC6] bg-[#FAF3E8] p-6 text-sm text-[#1F1A17]">
            <h3 className="font-bold text-base text-[#1F1A17]">Need Immediate Help with an Order?</h3>
            <p className="mt-1 text-xs text-[#1F1A17]/80">
              Our dedicated customer care team in Madikeri is ready to assist you:
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold">
              <span>📞 Phone: +91 98765 43210</span>
              <span>💬 WhatsApp: +91 79072 17317</span>
              <span>✉️ Email: imaanstrading@gmail.com</span>
            </div>
            <p className="mt-3 text-xs text-[#1F1A17]/70">
              Address: Imaan&apos;s Artisanal Products Pvt. Ltd., Estate Road, Madikeri, Coorg, Karnataka - 571201, India.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}

