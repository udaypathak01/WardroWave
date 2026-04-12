import { QrCode, Edit2, Trash2 } from 'lucide-react';

export default function InventoryTable({ inventory, searchQuery = '' }) {
  // Filter inventory based on search query
  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Item Name</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Category</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">MRP</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Rental Price</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Rentals</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Earnings</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">QR Code</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredInventory.length > 0 ? (
              filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{item.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">₹{item.price}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-bold">₹{item.rentalPrice}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.rented}</td>
                  <td className="px-6 py-4 text-sm text-green-600 font-bold">₹{item.earnings.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">
                    <button className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition text-xs font-medium">
                      <QrCode className="w-4 h-4" />
                      View
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-600">
                  No items found matching "{searchQuery}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
