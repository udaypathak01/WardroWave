import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ContactInfo from '../components/contact/ContactInfo';
import ContactForm from '../components/contact/ContactForm';

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <header className="bg-gradient-to-r from-purple-600 to-pink-600 py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Get in Touch</h1>
            <p className="text-lg md:text-xl text-gray-100 max-w-2xl mx-auto">
              Send our support team a message and we will get back to you.
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <ContactInfo />
        <div className="mx-auto max-w-3xl">
          <ContactForm />
        </div>
      </main>

      <Footer />
    </div>
  );
}
