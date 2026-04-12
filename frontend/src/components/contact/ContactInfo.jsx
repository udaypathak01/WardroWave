import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function ContactInfo() {
  const contactCards = [
    {
      icon: Mail,
      title: 'Email',
      info: 'support@wardrowave.com',
      subtext: "We'll respond within 24 hours",
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      icon: Phone,
      title: 'Phone',
      info: '+91 9876 543 210',
      subtext: 'Mon-Fri, 9AM-6PM IST',
      bgColor: 'bg-pink-100',
      iconColor: 'text-pink-600'
    },
    {
      icon: MapPin,
      title: 'Address',
      info: '123 Fashion Lane',
      subtext: 'Delhi, India 110001',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      icon: Clock,
      title: 'Working Hours',
      info: 'Monday - Friday: 9AM - 6PM',
      subtext: 'Saturday: 10AM - 4PM',
      bgColor: 'bg-pink-100',
      iconColor: 'text-pink-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 md:mb-16">
      {contactCards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition">
            <div className="flex justify-center mb-4">
              <div className={`p-3 ${card.bgColor} rounded-full`}>
                <IconComponent className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
            <p className="text-gray-600 text-sm">{card.info}</p>
            <p className="text-gray-500 text-xs mt-2">{card.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}
