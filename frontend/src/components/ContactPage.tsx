import React, { useState } from 'react';
import { 
  Headphones, 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { STORE_LOCATIONS } from '../data/mockData';
import { CustomerInquiry } from '../types';

interface ContactPageProps {
  onAddInquiry: (inquiry: CustomerInquiry) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onAddInquiry }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Mobile Inquiry',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      const newInquiry: CustomerInquiry = {
        id: `INQ-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().split('T')[0],
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
        status: 'New'
      };

      onAddInquiry(newInquiry);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: 'General Mobile Inquiry', message: '' });
    }
  };

  const faqs = [
    {
      q: 'Are all mobile phones 100% original factory sealed?',
      a: 'Yes! All new iPhones and Android devices sold on Mxmobilz are 100% brand new, factory sealed, and unlocked for worldwide GSM & CDMA network carriers.'
    },
    {
      q: 'How does the 1-Year Mxmobilz Shield Warranty work?',
      a: 'Every device purchase automatically includes 1 year of manufacturer warranty support. You can also add Mxmobilz Shield at checkout for accidental liquid or drop coverage with instant phone replacement.'
    },
    {
      q: 'What is the estimated delivery time for express orders?',
      a: 'Orders placed before 2:00 PM EST are dispatched same-day via FedEx or UPS Express. Standard delivery takes 1-2 business days across North America.'
    },
    {
      q: 'How do I submit my old phone for Trade-In credit?',
      a: 'Use our online Trade-In Estimator to calculate your device value. Upon checkout, we will mail a prepaid insured box to send us your old phone. Cash credit is applied immediately.'
    }
  ];

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-black uppercase tracking-wider">
            <Headphones className="w-3.5 h-3.5" /> 24/7 Mobile Specialist Support
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Contact Mxmobilz Support Team
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Have questions about iPhone 16 specs, trade-in quotes, bulk corporate purchases, or order tracking? Reach out to our expert team.
          </p>
        </div>

        {/* Form + Direct Contact Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          
          {/* Contact Form (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-4">
              <MessageSquare className="w-5 h-5 text-blue-600" /> Send Us A Support Message
            </h2>

            {submitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">Message Delivered Successfully!</h3>
                <p className="text-xs text-emerald-800 font-medium">
                  Thank you for reaching out. A mobile specialist will reply to your email within 2 business hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 cursor-pointer shadow-md"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="sarah@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Inquiry Subject</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:outline-none focus:bg-white focus:border-blue-600"
                    >
                      <option value="General Mobile Inquiry">General Mobile Inquiry</option>
                      <option value="Order Status & Dispatch">Order Status & Dispatch</option>
                      <option value="Trade-In Quote Questions">Trade-In Quote Questions</option>
                      <option value="Bulk Corporate Procurement">Bulk Corporate Procurement</option>
                      <option value="Warranty & Repair Service">Warranty & Repair Service</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Your Message *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your inquiry or requested device details..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Submit Customer Inquiry
                </button>
              </form>
            )}
          </div>

          {/* Quick Support Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Direct Customer Hotline</h3>
              <p className="text-xs text-slate-600 font-medium">Speak directly to an authorized mobile specialist.</p>
              <div className="text-sm font-black text-blue-600">+1 (800) 555-MXMOBILZ</div>
              <div className="text-[10px] text-slate-500 font-semibold">Toll-Free Mon-Sat (8am - 10pm EST)</div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Email Support desk</h3>
              <p className="text-xs text-slate-600 font-medium">Send inquiries for technical specs or warranty returns.</p>
              <div className="text-sm font-black text-emerald-600">support@mxmobilz.com</div>
              <div className="text-[10px] text-slate-500 font-semibold">Average response time: 45 minutes</div>
            </div>

          </div>

        </div>

        {/* Physical Store Locations */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Our Physical Experience Flagship Stores</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STORE_LOCATIONS.map(loc => (
              <div key={loc.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-3">
                <img src={loc.mapImage} alt={loc.city} className="w-full h-40 object-cover" referrerPolicy="no-referrer" />
                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-slate-900 text-base">{loc.city}</h3>
                  <p className="text-xs text-slate-700 flex items-start gap-1.5 font-medium">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    {loc.address}
                  </p>
                  <p className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    {loc.phone}
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-2 border-t border-slate-200 font-semibold">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    {loc.hours}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-4">
            <HelpCircle className="w-5 h-5 text-indigo-600" /> Frequently Asked Mobile Questions
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-900 flex items-center justify-between hover:bg-slate-100 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition transform ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaqIndex === idx && (
                  <div className="p-4 pt-0 text-xs text-slate-600 border-t border-slate-200 leading-relaxed font-medium">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
