export default function RecentActivity({ activities = [] }) {

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((rental, idx) => (
          <div key={idx} className="flex items-center justify-between border-b pb-3">
            <div>
              <p className="font-medium text-gray-900">{rental.item}</p>
              <p className="text-sm text-gray-600">{rental.customer}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{new Date(rental.date).toLocaleDateString()}</p>
              <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-bold ${
                rental.status === 'Active' ? 'bg-blue-100 text-blue-600' :
                rental.status === 'Delivered' ? 'bg-green-100 text-green-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                {rental.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
