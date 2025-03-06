'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Customers() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerData, setCustomerData] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchAndProcessData = async () => {
      try {
        const response = await fetch('/api/smartsheet');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        
        // Process data to get customer statistics
        const customerStats = new Map();
        
        // Column IDs
        const clientNameColumnId = 1568237487449988;
        const containerNumberColumnId = 3820037301135236;
        const statusColumnId = 442337580607364;

        // Process each row
        data.rows?.forEach(row => {
          const clientCell = row.cells.find(cell => cell.columnId === clientNameColumnId);
          const statusCell = row.cells.find(cell => cell.columnId === statusColumnId);
          const containerCell = row.cells.find(cell => cell.columnId === containerNumberColumnId);

          const clientName = clientCell?.displayValue || clientCell?.value;
          const status = statusCell?.displayValue || statusCell?.value;
          const container = containerCell?.displayValue || containerCell?.value;

          if (clientName && status && container) {
            if (!customerStats.has(clientName)) {
              customerStats.set(clientName, {
                totalContainers: 0,
                statusBreakdown: {}
              });
            }

            const customerInfo = customerStats.get(clientName);
            customerInfo.totalContainers += 1;
            customerInfo.statusBreakdown[status] = (customerInfo.statusBreakdown[status] || 0) + 1;
          }
        });

        // Convert Map to array for easier rendering
        const processedData = Array.from(customerStats.entries()).map(([name, stats]) => ({
          customerName: name,
          ...stats
        }));

        setCustomerData(processedData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAndProcessData();
  }, []);

  const getStatusColor = (status) => {
    const statusColors = {
      'Delivered': 'bg-green-100 text-green-800',
      'Moving Loaded': 'bg-blue-100 text-blue-800',
      'Moving Empty': 'bg-yellow-100 text-yellow-800',
      'Waiting to Load': 'bg-orange-100 text-orange-800',
      'Loaded Waiting for Dispatch': 'bg-purple-100 text-purple-800',
      'Waiting for Import Clearance': 'bg-indigo-100 text-indigo-800',
      'Waiting for RIT Clearance': 'bg-pink-100 text-pink-800',
      'Waiting for Export Clearance': 'bg-cyan-100 text-cyan-800',
      'Waiting to Offload': 'bg-teal-100 text-teal-800',
      'Minor Breakdown': 'bg-red-100 text-red-800',
      'Workshop - Awaiting facilities': 'bg-gray-100 text-gray-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Customer Overview</h2>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Containers</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Container Status Breakdown</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customerData.map((customer, index) => (
              <tr 
                key={index} 
                className="hover:bg-gray-50 cursor-pointer transition duration-150"
                onClick={() => router.push(`/tracking/customers/${encodeURIComponent(customer.customerName)}`)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                      {customer.customerName.charAt(0)}
                    </div>
                    <span className="ml-3 font-medium">{customer.customerName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-lg font-semibold text-gray-900">
                    {customer.totalContainers}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(customer.statusBreakdown).map(([status, count]) => (
                      <span
                        key={status}
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}
                      >
                        {status}: {count}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-500">
        Showing {customerData.length} customers
      </div>
    </div>
  );
} 