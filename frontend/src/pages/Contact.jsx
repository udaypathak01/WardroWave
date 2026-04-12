import { useEffect } from 'react';

import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ContactInfo from '../components/contact/ContactInfo';
import ContactForm from '../components/contact/ContactForm';
import FAQSection from '../components/contact/FAQSection';
import SocialMedia from '../components/contact/SocialMedia';

export default function Contact() {
  useEffect(() => {

  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Get in Touch</h1>
            <p className="text-lg md:text-xl text-gray-100 max-w-2xl mx-auto">
              We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        
        {/* Contact Info Cards */}
        <ContactInfo />

        {/* Contact Form and FAQ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          <ContactForm />

          {/* FAQ and Social */}
          <div className="space-y-6">
            <FAQSection />
            <SocialMedia />
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="mt-12 md:mt-16 bg-white rounded-lg shadow-md overflow-hidden h-96">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3501.5404405555555!2d77.2061!3d28.6139!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd288ee30e6d%3A0x8b8b8b8b8b8b8b8b!2sDelhi%2C%20India!5e0!3m2!1sen!2sin!4v1234567890"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="WardroWave Location"
          ></iframe>
        </div>
      </div>

      <Footer />
    </div>
  );
}
