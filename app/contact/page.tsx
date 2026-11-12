"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Ubuntu } from "next/font/google";
import { MapPin, Phone, Mail, Clock, MessageSquare, Send, CheckCircle2 } from "lucide-react";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export default function ContactUsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className={`${ubuntu.className} min-h-screen bg-[#FAF7F2] text-[#1F1A17]`}>
      {/* Header Banner */}
      <section className="border-b border-[#E9DCC6] bg-[#F5EDE0] py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7A5A3C]">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <span>/</span>
            <span>Contact Us</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#1F1A17] sm:text-4xl md:text-5xl">
            Contact &amp; Store Information
          </h1>
          <p className="mt-3 text-sm text-[#1F1A17]/75 sm:text-base">
            We’d love to hear from you. Visit our store in Coorg or reach out to our team.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Store Details / Information (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-2xl border border-[#E9DCC6] bg-white p-6 shadow-xs sm:p-8">
              <h2 className="text-xl font-bold text-[#1F1A17]">Physical Store &amp; Office</h2>
              <p className="mt-2 text-xs leading-relaxed text-[#1F1A17]/70">
                Come experience our freshly roasted coffees, aromatic spices, and luxury goods in person.
              </p>

              <div className="mt-6 space-y-5 text-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[#FAF3E8] p-2 text-[#7A5A3C]">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1F1A17]">Registered Address</h3>
                    <p className="mt-0.5 text-xs font-medium text-[#1F1A17]/80 leading-relaxed">
                      Imaan&apos;s Artisanal Products Pvt. Ltd.<br />
                      Estate Road, Madikeri,<br />
                      Coorg, Karnataka - 571201, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[#FAF3E8] p-2 text-[#7A5A3C]">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1F1A17]">Phone &amp; WhatsApp</h3>
                    <p className="mt-0.5 text-xs text-[#1F1A17]/80">
                      <a href="tel:+919876543210" className="hover:text-[#7A5A3C] hover:underline">
                        +91 98765 43210
                      </a>
                    </p>
                    <p className="text-xs text-[#1F1A17]/80">
                      WhatsApp:{" "}
                      <a
                        href="https://wa.me/7907217317"
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-[#7A5A3C] hover:underline"
                      >
                        +91 79072 17317
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[#FAF3E8] p-2 text-[#7A5A3C]">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1F1A17]">Customer Support Email</h3>
                    <p className="mt-0.5 text-xs text-[#1F1A17]/80">
                      <a href="mailto:imaanstrading@gmail.com" className="hover:text-[#7A5A3C] hover:underline">
                        imaanstrading@gmail.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[#FAF3E8] p-2 text-[#7A5A3C]">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1F1A17]">Operating Hours</h3>
                    <p className="mt-0.5 text-xs text-[#1F1A17]/80">
                      Monday to Saturday: 9:00 AM – 7:30 PM IST<br />
                      Sunday: 10:00 AM – 5:00 PM IST
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Assistance Box */}
            <div className="rounded-2xl border border-[#E9DCC6] bg-[#FAF3E8] p-6 text-xs text-[#1F1A17]/80">
              <h4 className="font-bold text-sm text-[#1F1A17]">Order or Refund Queries?</h4>
              <p className="mt-1">
                Please mention your <strong>Order ID</strong> (found in your order confirmation email or SMS) so our team can resolve your query faster.
              </p>
            </div>
          </div>

          {/* Contact Message Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-[#E9DCC6] bg-white p-6 shadow-xs sm:p-10">
              <h2 className="text-xl font-bold text-[#1F1A17]">Send Us a Message</h2>
              <p className="mt-1 text-xs text-[#1F1A17]/70">
                Have a question about our products, corporate orders, or store visits? Fill out the form below.
              </p>

              {submitted ? (
                <div className="mt-8 rounded-xl bg-[#FAF3E8] p-8 text-center border border-[#E9DCC6]">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-[#7A5A3C]" />
                  <h3 className="mt-4 text-lg font-bold text-[#1F1A17]">Message Received!</h3>
                  <p className="mt-2 text-sm text-[#1F1A17]/75">
                    Thank you for reaching out to Imaan&apos;s Store. Our customer care team will get back to you within 24 business hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
                    }}
                    className="mt-6 rounded-lg bg-[#7A5A3C] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#634830]"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#1F1A17]" htmlFor="name">
                        Your Full Name *
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="mt-1.5 w-full rounded-lg border border-[#E9DCC6] bg-transparent px-3.5 py-2.5 text-sm text-[#1F1A17] outline-none focus:border-[#7A5A3C] focus:ring-1 focus:ring-[#7A5A3C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1F1A17]" htmlFor="email">
                        Email Address *
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="e.g. rahul@example.com"
                        className="mt-1.5 w-full rounded-lg border border-[#E9DCC6] bg-transparent px-3.5 py-2.5 text-sm text-[#1F1A17] outline-none focus:border-[#7A5A3C] focus:ring-1 focus:ring-[#7A5A3C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#1F1A17]" htmlFor="phone">
                        Phone Number (Optional)
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="e.g. +91 98765 43210"
                        className="mt-1.5 w-full rounded-lg border border-[#E9DCC6] bg-transparent px-3.5 py-2.5 text-sm text-[#1F1A17] outline-none focus:border-[#7A5A3C] focus:ring-1 focus:ring-[#7A5A3C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1F1A17]" htmlFor="subject">
                        Subject *
                      </label>
                      <input
                        id="subject"
                        type="text"
                        required
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder="Order query, wholesale inquiry, etc."
                        className="mt-1.5 w-full rounded-lg border border-[#E9DCC6] bg-transparent px-3.5 py-2.5 text-sm text-[#1F1A17] outline-none focus:border-[#7A5A3C] focus:ring-1 focus:ring-[#7A5A3C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1F1A17]" htmlFor="message">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      required
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Write your message or inquiry here..."
                      className="mt-1.5 w-full rounded-lg border border-[#E9DCC6] bg-transparent px-3.5 py-2.5 text-sm text-[#1F1A17] outline-none focus:border-[#7A5A3C] focus:ring-1 focus:ring-[#7A5A3C]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#7A5A3C] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#634830]"
                  >
                    Send Message
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

