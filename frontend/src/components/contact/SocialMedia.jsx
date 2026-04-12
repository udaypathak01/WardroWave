import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function SocialMedia() {
  const socialLinks = [
    { icon: Facebook, name: 'Facebook', color: 'text-purple-600', bg: 'bg-purple-50', hoverBg: 'hover:bg-purple-100' },
    { icon: Twitter, name: 'Twitter', color: 'text-pink-600', bg: 'bg-pink-50', hoverBg: 'hover:bg-pink-100' },
    { icon: Instagram, name: 'Instagram', color: 'text-purple-600', bg: 'bg-purple-50', hoverBg: 'hover:bg-purple-100' },
    { icon: Linkedin, name: 'LinkedIn', color: 'text-pink-600', bg: 'bg-pink-50', hoverBg: 'hover:bg-pink-100' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Follow Us</h2>
      <p className="text-gray-700 mb-6">Connect with us on social media for the latest updates and fashion inspiration.</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {socialLinks.map((social, index) => {
          const IconComponent = social.icon;
          return (
            <a 
              key={index}
              href={`#${social.name.toLowerCase()}`}
              className={`flex items-center justify-center p-4 ${social.bg} rounded-lg ${social.hoverBg} transition group`}
            >
              <IconComponent className={`w-6 h-6 ${social.color} group-hover:scale-110 transition`} />
            </a>
          );
        })}
      </div>

      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-bold">📧 Newsletter:</span> Subscribe to our newsletter for exclusive deals and fashion tips!
        </p>
      </div>
    </div>
  );
}
