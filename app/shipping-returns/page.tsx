"use client";

import Link from "next/link";
import { Ubuntu } from "next/font/google";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  HelpCircle,
  Package,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export default function ShippingAndReturnsPage() {
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
            <span>Shipping &amp; Returns</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#1F1A17] sm:text-4xl md:text-5xl">
            Shipping &amp; Return Policy
          </h1>
          <p className="mt-3 text-sm text-[#1F1A17]/75 sm:text-base">
            Everything you need to know about delivery timelines, shipping charges, order tracking, and returns.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8 rounded-2xl border border-[#E9DCC6] bg-white p-6 shadow-xs sm:p-10">
          {/* Key Guarantees Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-xl bg-[#FAF3E8] p-4 text-[#7A5A3C]">
              <Truck className="h-5 w-5 shrink-0 mt-0.5 text-[#7A5A3C]" />
              <div>
                <h4 className="text-sm font-bold text-[#1F1A17]">Free Shipping</h4>
                <p className="mt-1 text-xs text-[#1F1A17]/70">On all eligible domestic orders above ₹999.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-[#FAF3E8] p-4 text-[#7A5A3C]">
              <Clock className="h-5 w-5 shrink-0 mt-0.5 text-[#7A5A3C]" />
              <div>
                <h4 className="text-sm font-bold text-[#1F1A17]">Dispatched in 24-48h</h4>
                <p className="mt-1 text-xs text-[#1F1A17]/70">Fast warehouse handling with live AWB tracking.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-[#FAF3E8] p-4 text-[#7A5A3C]">
              <RotateCcw className="h-5 w-5 shrink-0 mt-0.5 text-[#7A5A3C]" />
              <div>
                <h4 className="text-sm font-bold text-[#1F1A17]">Hassle-Free Returns</h4>
                <p className="mt-1 text-xs text-[#1F1A17]/70">7-day replacement or refund for damaged items.</p>
              </div>
            </div>
          </div>

          {/* Section 1: Shipping Policy */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E9DCC6] pb-2">
              <Truck className="h-5 w-5 text-[#7A5A3C]" />
              <h2 className="text-xl font-bold text-[#1F1A17]">1. Shipping &amp; Delivery Policy</h2>
            </div>
            
            <div className="space-y-3 text-sm leading-relaxed text-[#1F1A17]/85">
              <p>
                At <strong>Imaan&apos;s Store (iBrew)</strong>, we take utmost care to ensure your artisanal coffee,
                fresh spices, fragrances, and home lifestyle products reach you in pristine condition and as quickly
                as possible.
              </p>

              <h3 className="text-sm font-bold text-[#1F1A17] pt-2">Order Processing &amp; Dispatch:</h3>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Orders are verified and packaged at our warehouse within <strong>24 to 48 hours</strong> of placement (excluding Sundays and national holidays).</li>
                <li>Artisanal freshly ground coffee is roasted and ground in small batches immediately prior to packaging to ensure maximum aroma and freshness.</li>
              </ul>

              <h3 className="text-sm font-bold text-[#1F1A17] pt-2">Estimated Delivery Timelines:</h3>
              <ul className="list-disc space-y-1.5 pl-5">
                <li><strong>Metro Cities (Bangalore, Mumbai, Delhi, Chennai, Hyderabad, Kolkata):</strong> 2 to 4 business days.</li>
                <li><strong>Rest of India:</strong> 4 to 7 business days depending on delivery PIN code and local logistics accessibility.</li>
                <li><strong>Imported Mattresses &amp; Bulky Goods:</strong> Handled via specialized surface transit; delivery typically takes 5 to 9 business days with door-delivery assistance.</li>
              </ul>

              <h3 className="text-sm font-bold text-[#1F1A17] pt-2">Shipping Rates:</h3>
              <ul className="list-disc space-y-1.5 pl-5">
                <li><strong>Free Shipping</strong> applies automatically to all orders with a total value of <strong>₹999 or higher</strong>.</li>
                <li>For orders below ₹999, a nominal flat standard shipping fee of <strong>₹60</strong> is calculated at checkout.</li>
                <li>Special promotional codes (e.g. <code>FREESHIP</code>) may offer free shipping on lower order values when active.</li>
              </ul>
            </div>
          </section>

          {/* Section 2: Order Tracking */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E9DCC6] pb-2">
              <Package className="h-5 w-5 text-[#7A5A3C]" />
              <h2 className="text-xl font-bold text-[#1F1A17]">2. Live Tracking &amp; Notifications</h2>
            </div>
            
            <div className="space-y-3 text-sm leading-relaxed text-[#1F1A17]/85">
              <p>
                As soon as your package is dispatched from our fulfillment centre, an automated email notification
                containing the courier name and <strong>Air Waybill (AWB) Tracking Number</strong> is generated.
              </p>
              <p>
                You can also track your live order status at any time by visiting the{" "}
                <Link href="/orders" className="font-semibold text-[#7A5A3C] underline hover:text-[#1F1A17]">
                  My Orders
                </Link>{" "}
                section of your account.
              </p>
            </div>
          </section>

          {/* Section 3: Return & Replacement Policy */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E9DCC6] pb-2">
              <RotateCcw className="h-5 w-5 text-[#7A5A3C]" />
              <h2 className="text-xl font-bold text-[#1F1A17]">3. Return, Replacement &amp; Cancellation Policy</h2>
            </div>
            
            <div className="space-y-3 text-sm leading-relaxed text-[#1F1A17]/85">
              <p>
                Customer satisfaction is our highest priority. Because many of our products are perishable food and
                beverage items (such as whole bean coffee, ground coffee, and culinary spices) or personal care products:
              </p>

              <h3 className="text-sm font-bold text-[#1F1A17] pt-2">Eligible Conditions for Return or Replacement:</h3>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Product received is damaged, leaking, or package seal was tampered with during transit.</li>
                <li>Incorrect product, incorrect variant, or wrong size received compared to your invoice.</li>
                <li>Product has expired prior to receipt or has an manufacturing quality defect.</li>
              </ul>

              <h3 className="text-sm font-bold text-[#1F1A17] pt-2">How to Request a Return or Replacement:</h3>
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>
                  Notify our support team within <strong>7 days of delivery</strong> via WhatsApp at{" "}
                  <a href="https://wa.me/7907217317" className="font-semibold text-[#7A5A3C] underline">
                    +91 79072 17317
                  </a>{" "}
                  or email at{" "}
                  <a href="mailto:imaanstrading@gmail.com" className="font-semibold text-[#7A5A3C] underline">
                    imaanstrading@gmail.com
                  </a>
                  .
                </li>
                <li>Please include your <strong>Order ID</strong>, description of the issue, and 1–2 clear photographs of the package/product.</li>
                <li>Our team will inspect the request and arrange a free pickup or issue a prompt replacement/refund within 24–48 hours.</li>
              </ol>

              <h3 className="text-sm font-bold text-[#1F1A17] pt-2">Order Cancellations:</h3>
              <p>
                You can cancel an order directly from the{" "}
                <Link href="/orders" className="font-semibold text-[#7A5A3C] underline">
                  Orders page
                </Link>{" "}
                at any time before the status transitions to <em>Dispatched</em>. Once dispatched, cancellation is
                no longer possible, but you may refuse delivery upon arrival.
              </p>
            </div>
          </section>

          {/* Section 4: Refund Process */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E9DCC6] pb-2">
              <ShieldCheck className="h-5 w-5 text-[#7A5A3C]" />
              <h2 className="text-xl font-bold text-[#1F1A17]">4. Refund Timelines &amp; Methods</h2>
            </div>
            
            <div className="space-y-3 text-sm leading-relaxed text-[#1F1A17]/85">
              <ul className="list-disc space-y-1.5 pl-5">
                <li><strong>Prepaid Orders (UPI, Cards, NetBanking):</strong> Refunds are reversed directly to the original payment source within <strong>5 to 7 working days</strong> from cancellation approval.</li>
                <li><strong>Cash on Delivery (COD) Orders:</strong> In cases where a return is approved for a COD order, the refund will be credited directly to your bank account via UPI / NEFT transfer upon verification.</li>
              </ul>
            </div>
          </section>

          {/* Section 5: Contact Support Banner */}
          <div className="rounded-xl border border-[#E9DCC6] bg-[#FAF3E8] p-6 text-center sm:p-8">
            <HelpCircle className="mx-auto h-8 w-8 text-[#7A5A3C]" />
            <h3 className="mt-3 text-lg font-bold text-[#1F1A17]">Have Questions or Need Help?</h3>
            <p className="mt-1 text-sm text-[#1F1A17]/70">
              Our dedicated support team is available Monday through Saturday from 9:00 AM to 7:00 PM IST.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://wa.me/7907217317"
                className="inline-flex items-center gap-2 rounded-full bg-[#7A5A3C] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#1F1A17]"
              >
                <span>WhatsApp Us</span>
              </a>
              <a
                href="mailto:imaanstrading@gmail.com"
                className="inline-flex items-center gap-2 rounded-full border border-[#7A5A3C] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white"
              >
                <span>Email Support</span>
              </a>
            </div>
          </div>

          {/* Back button */}
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

