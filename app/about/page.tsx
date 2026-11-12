"use client";

import Link from "next/link";
import { Ubuntu } from "next/font/google";
import { Coffee, Award, Sparkles, HeartHandshake, MapPin, ShieldCheck, ArrowRight } from "lucide-react";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export default function AboutUsPage() {
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
            <span>About Us</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#1F1A17] sm:text-4xl md:text-5xl">
            About Imaan&apos;s Store
          </h1>
          <p className="mt-3 text-sm text-[#1F1A17]/75 sm:text-base">
            Crafting authenticity from the misty hills of Coorg to your doorstep.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-10 rounded-2xl border border-[#E9DCC6] bg-white p-6 shadow-xs sm:p-10">
          
          {/* Welcome Intro */}
          <div className="space-y-4">
            <span className="inline-block rounded-full bg-[#FAF3E8] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#7A5A3C]">
              Our Heritage
            </span>
            <h2 className="text-2xl font-bold text-[#1F1A17] sm:text-3xl">
              Rooted in Nature, Committed to Purity
            </h2>
            <p className="text-sm leading-relaxed text-[#1F1A17]/80 sm:text-base">
              Welcome to <strong>Imaan&apos;s Store</strong> (operated by <em>Imaan&apos;s Artisanal Products Pvt. Ltd.</em>). 
              Born amidst the lush coffee estates and misty slopes of Madikeri, Coorg, our journey began with a simple passion: 
              to share the unfiltered richness of authentic Indian hill-country produce and world-class artisanal essentials with the world.
            </p>
            <p className="text-sm leading-relaxed text-[#1F1A17]/80 sm:text-base">
              Over the years, we have expanded from single-estate plantation coffees and hand-harvested spices into carefully curated 
              lifestyle luxuries—including imported Arabian fragrances, premium Medjool &amp; Ajwa dates, coffee-infused skincare, 
              and imported luxury orthopedic mattresses.
            </p>
          </div>

          {/* Pillars Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-[#E9DCC6] bg-[#FAF7F2] p-5">
              <Coffee className="h-8 w-8 text-[#7A5A3C]" />
              <h3 className="mt-3 text-base font-bold text-[#1F1A17]">Estate Fresh Coffee</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#1F1A17]/70">
                100% shade-grown Arabica and Robusta beans, batch-roasted in small batches to preserve peak aroma and crema.
              </p>
            </div>

            <div className="rounded-xl border border-[#E9DCC6] bg-[#FAF7F2] p-5">
              <Sparkles className="h-8 w-8 text-[#7A5A3C]" />
              <h3 className="mt-3 text-base font-bold text-[#1F1A17]">Curated Luxuries</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#1F1A17]/70">
                Authentic Middle Eastern attars, natural oud, whole organic spices, and premium bedding designed for wholesome living.
              </p>
            </div>

            <div className="rounded-xl border border-[#E9DCC6] bg-[#FAF7F2] p-5">
              <HeartHandshake className="h-8 w-8 text-[#7A5A3C]" />
              <h3 className="mt-3 text-base font-bold text-[#1F1A17]">Fair &amp; Ethical</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#1F1A17]/70">
                We work directly with local farmers and trusted ethical suppliers, eliminating middlemen to guarantee honest pricing.
              </p>
            </div>
          </div>

          {/* Physical Presence */}
          <div className="rounded-xl bg-[#FAF3E8] p-6 text-[#1F1A17] sm:p-8">
            <div className="flex items-start gap-4">
              <MapPin className="h-7 w-7 shrink-0 text-[#7A5A3C] mt-1" />
              <div>
                <h3 className="text-lg font-bold text-[#1F1A17]">Our Physical Experience Store &amp; Headquarters</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#1F1A17]/80">
                  Whether you are a traveler exploring the breathtaking viewpoints of Coorg or a local connoisseur, 
                  we invite you to visit our physical experience center to sample fresh roasts and fragrant botanicals.
                </p>
                <div className="mt-4 rounded-lg border border-[#E9DCC6] bg-white p-4 text-sm font-medium">
                  <p className="font-bold text-[#1F1A17]">Imaan&apos;s Artisanal Products Pvt. Ltd.</p>
                  <p className="text-[#1F1A17]/80">Estate Road, Madikeri</p>
                  <p className="text-[#1F1A17]/80">Coorg, Karnataka - 571201, India</p>
                  <p className="mt-2 text-xs text-[#7A5A3C]">Operating Hours: Monday – Saturday (9:00 AM – 7:30 PM IST)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Commitment */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#1F1A17]">Our Quality Promise</h3>
            <p className="text-sm leading-relaxed text-[#1F1A17]/80">
              Every item bearing the Imaan&apos;s seal undergoes rigorous hygiene and quality checks. 
              Our coffee packages are vacuum-sealed with one-way freshness degassing valves, our dates are 100% natural with no added sugar, 
              and our spice blends are non-irradiated and chemical-free.
            </p>
          </div>

          {/* Call to action */}
          <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-[#E9DCC6] bg-[#1F1A17] p-6 text-white sm:flex-row sm:p-8">
            <div>
              <h4 className="text-lg font-bold">Have queries or seeking wholesale partnerships?</h4>
              <p className="mt-1 text-xs text-white/80 sm:text-sm">
                Get in touch with our team or browse our catalog today.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-[#E9DCC6] px-5 py-2.5 text-xs font-bold text-[#1F1A17] transition hover:bg-white"
              >
                Contact Us
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

