export default function FAQSection() {
  const faqs = [
    {
      question: 'How long does shipping take?',
      answer: 'Standard delivery takes 3-5 business days. Express delivery is available in select cities.'
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer 30-day returns on most items. Products must be unworn and in original packaging.'
    },
    {
      question: 'Do you ship internationally?',
      answer: 'Currently, we ship only within India. International shipping coming soon!'
    },
    {
      question: 'How do I track my order?',
      answer: "You'll receive a tracking number via email once your order ships. You can track it on our website."
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
      
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border-b pb-4 last:border-b-0">
            <h3 className="font-bold text-gray-900 mb-2">{faq.question}</h3>
            <p className="text-gray-700 text-sm">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
