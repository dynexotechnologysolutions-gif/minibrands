"use client";

import React, { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setStatus("error");
      setErrorMessage("Please fill out all required fields.");
      return;
    }

    setStatus("loading");

    try {
      // Mock API dispatch
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMessage("Failed to send message. Please try again later.");
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Business Coordinates */}
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Contact Us</h1>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Have questions about your order, boutique verification, or how our escrow system works? Get in touch with our team.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Support Email</h3>
              <p className="text-lg font-medium text-slate-900 mt-1">support@MiniBrands.in</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Business Hours</h3>
              <p className="text-slate-900 mt-1">Monday – Saturday: 10:00 AM – 7:00 PM IST</p>
              <p className="text-xs text-slate-500">Excluding National Holidays</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Office Address</h3>
              <p className="text-slate-900 mt-1 leading-relaxed">
                Velvet Lane Tech Hub,<br />
                Adyar, Chennai - 600020,<br />
                Tamil Nadu, India
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Send a Message</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ananya Kumar"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                id="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="ananya@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Order Query / Seller Inquiry"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-1">Message *</label>
              <textarea
                id="message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                placeholder="Type your message here..."
                required
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-rose-600 font-medium">{errorMessage}</p>
            )}

            {status === "success" && (
              <p className="text-sm text-emerald-600 font-medium">Thank you! Your message has been sent successfully.</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
            >
              {status === "loading" ? "Sending..." : "Submit Inquiry"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
