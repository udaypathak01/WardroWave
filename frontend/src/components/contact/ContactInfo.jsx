import { Mail, Send } from 'lucide-react';
import { usePublicConfigQuery } from '../../lib/api/hooks';

function ContactCard({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center">
      <div className="flex justify-center mb-4">
        <div className="p-3 bg-purple-100 rounded-full">
          <Icon className="w-6 h-6 text-purple-600" />
        </div>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>
      {children}
    </div>
  );
}

export default function ContactInfo() {
  const configQuery = usePublicConfigQuery();
  const supportEmail = configQuery.data?.data.supportEmail;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 md:mb-16">
      <ContactCard icon={Mail} title="Support email">
        {configQuery.isPending ? (
          <p role="status" className="text-gray-500 text-sm">Loading support contact…</p>
        ) : configQuery.isError ? (
          <div role="alert">
            <p className="text-red-700 text-sm">Support email is unavailable right now.</p>
            <button
              type="button"
              onClick={() => configQuery.refetch()}
              className="mt-2 text-sm font-semibold text-purple-600 underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <a className="text-purple-700 underline break-all" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>
        )}
      </ContactCard>
      <ContactCard icon={Send} title="Send a message">
        <p className="text-gray-600 text-sm">
          Use the contact form below to send a request to customer support.
        </p>
      </ContactCard>
    </div>
  );
}
