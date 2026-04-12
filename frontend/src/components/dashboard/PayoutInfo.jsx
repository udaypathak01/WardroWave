export default function PayoutInfo({ totalEarnings, pendingPayout = 0 }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Payout Information</h3>
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Available Balance</p>
          <p className="text-2xl font-bold text-green-600 mt-1">₹{totalEarnings.toLocaleString()}</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">On Hold (Current Rentals)</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">₹{pendingPayout.toLocaleString()}</p>
        </div>
        <button className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition font-bold">
          Request Payout
        </button>
        <p className="text-xs text-gray-600 text-center mt-2">
          Next payout will be processed on 30th Nov. Minimum payout: ₹1000
        </p>
      </div>
    </div>
  );
}
