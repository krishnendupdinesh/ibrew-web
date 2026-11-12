"use client";

import Link from "next/link";
import { Ubuntu } from "next/font/google";
import { Scale, FileText, CheckCircle2, AlertCircle, ShoppingBag, CreditCard, Shield } from "lucide-react";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export default function TermsAndConditionsPage() {
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
            <span>Legal</span>
            <span>/</span>
            <span>Terms &amp; Conditions</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#1F1A17] sm:text-4xl md:text-5xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-3 text-sm text-[#1F1A17]/75 sm:text-base">
            Please read these terms and conditions carefully before using our website or ordering our products.
          </p>
          <p className="mt-1 text-xs text-[#1F1A17]/60">
            Last Updated: November 2026 · Imaan&apos;s Artisanal Products Pvt. Ltd.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8 rounded-2xl border border-[#E9DCC6] bg-white p-6 shadow-xs sm:p-10">
          
          <div className="flex items-center gap-3 rounded-xl bg-[#FAF3E8] p-4 text-[#7A5A3C]">
            <Scale className="h-6 w-6 shrink-0" />
            <p className="text-xs font-medium leading-relaxed sm:text-sm">
              These Terms &amp; Conditions govern your access to and use of <strong>ibrew-web.vercel.app</strong> and all services provided by 
              <strong> Imaan&apos;s Artisanal Products Pvt. Ltd.</strong> By accessing our website or placing an order, you agree to be bound by these terms.
            </p>
          </div>

          {/* Section 1: Entity Information */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1F1A17]">1. Company Information</h2>
            <p className="text-sm leading-relaxed text-[#1F1A17]/80">
              The website is operated by <strong>Imaan&apos;s Artisanal Products Pvt. Ltd.</strong>, having its registered office at:
              <br />
              <span className="font-semibold text-[#1F1A17]">
                Estate Road, Madikeri, Coorg, Karnataka - 571201, India.
              </span>
              <br />
              Email: <em>imaanstrading@gmail.com</em> | Telephone: <em>+91 98765 43210</em>
            </p>
          </section>

          {/* Section 2: Account & Eligibility */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1F1A17]">2. Eligibility &amp; User Accounts</h2>
            <p className="text-sm leading-relaxed text-[#1F1A17]/80">
              To place orders on our platform, you must be at least 18 years of age or access the website under parental/guardian supervision. 
              You are responsible for maintaining the confidentiality of your account credentials and password. 
              You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          {/* Section 3: Products & Pricing */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1F1A17]">3. Products, Availability &amp; Pricing</h2>
            <p className="text-sm leading-relaxed text-[#1F1A17]/80">
              We make every effort to display the colors, specifications, roast levels, and details of our coffee, spices, dates, fragrances, 
              and mattresses accurately. However, natural products like coffee beans and spices may have seasonal harvest variations.
            </p>
            <p className="text-sm leading-relaxed text-[#1F1A17]/80">
              All prices are listed in Indian Rupees (₹ INR) inclusive of applicable Goods and Services Tax (GST). 
              We reserve the right to revise product prices and update product availability without prior notice.
            </p>
          </section>

          {/* Section 4: Payments & Gateways */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1F1A17]">4. Payments &amp; Security</h2>
            <p className="text-sm leading-relaxed text-[#1F1A17]/80">
              We accept online payments via <strong>Razorpay</strong>, supporting:
            </p>
            <ul className="list-inside list-disc space-y-1.5 pl-2 text-sm text-[#1F1A17]/80">
              <li>UPI (Google Pay, PhonePe, Paytm, BHIM, Cred)</li>
              <li>Credit and Debit Cards (Mastercard, Visa, RuPay, American Express)</li>
              <li>Net Banking across all major scheduled Indian banks</li>
              <li>Cash on Delivery (COD) on select pin codes and products</li>
            </ul>
            <p className="text-sm leading-relaxed text-[#1F1A17]/80">
              All transactions are secured using standard 128/256-bit SSL encryption. We do not store your confidential card PINs, CVV, 
              or bank passwords on our servers.
            </p>
          </section>

          {/* Section 5: Orders, Shipping & Cancellation */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1F1A17]">5. Orders &amp; Cancellations</h2>
            <p className="text-sm leading-relaxed text-[#1F1A17]/80">
              Upon placing an order, you will receive an order confirmation email containing your Order ID. 
              Orders can be cancelled before they are dispatched from our warehouse by visiting your 
              <Link href="/orders" className="text-[#7A5A3C] underline mx-1">Order History</Link> or contacting our WhatsApp support.
              Once an order has been handed over to our courier partner, it cannot be cancelled, but may be eligible for return under our 
              <Link href="/refund-cancellation" className="text-[#7A5A3C] underline mx-1">Refund &amp; Cancellation Policy</Link>.
            </p>
          </section>

          {/* Section 6: Intellectual Property */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1F1A17]">6. Intellectual Property Rights</h2>
            <p className="text-sm leading-relaxed text-[#1F1A17]/80">
              All content on this website—including brand logos, images, graphics, product descriptions, website design, and code—is 
              the proprietary intellectual property of Imaan&apos;s Artisanal Products Pvt. Ltd. and is protected under applicable Indian copyright 
              and trademark laws. No content may be copied, reproduced, or republished without prior written authorization.
            </p>
          </section>

          {/* Section 7: Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1F1A17]">7. Limitation of Liability</h2>
            <p className="text-sm leading-relaxed text-[#1F1A17]/80">
              Imaan&apos;s Store shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use 
              the website or products purchased, beyond the monetary purchase price of the product in dispute.
            </p>
          </section>

          {/* Section 8: Governing Law & Jurisdiction */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1F1A17]">8. Governing Law &amp; Jurisdiction</h2>
            <p className="text-sm leading-relaxed text-[#1F1A17]/80">
              These terms are governed by and construed in accordance with the laws of the Republic of India. 
              Any disputes arising out of or related to these terms shall be subject to the exclusive jurisdiction of the competent courts in 
              <strong> Madikeri, Kodagu District, Karnataka, India</strong>.
            </p>
          </section>

          {/* Contact footer */}
          <div className="mt-8 border-t border-[#E9DCC6] pt-6 text-xs text-[#1F1A17]/70">
            For legal notices or questions regarding these terms, please contact:
            <br />
            <strong>Compliance Officer</strong>, Imaan&apos;s Artisanal Products Pvt. Ltd., Estate Road, Madikeri, Coorg, Karnataka - 571201.
            <br />
            Email: <a href="mailto:imaanstrading@gmail.com" className="text-[#7A5A3C] underline">imaanstrading@gmail.com</a>
          </div>

        </div>
      </main>
    </div>
  );
}

