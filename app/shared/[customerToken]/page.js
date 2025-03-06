'use client';
import { useState, useEffect } from 'react';
import { use } from 'react';

export default function SharedCustomerDashboard({ params }) {

  const unwrappedParams = use(params);
  const token = decodeURIComponent(unwrappedParams.customerToken);
  const [sheetData, setSheetData] = useState({ columns: [], rows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredRows, setFilteredRows] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        // In a real application, you would validate the token and get the customer name
        const response = await fetch('/api/smartsheet');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        setSheetData(data);

        // Decode the customer name from the token
        const customerName = atob(token);

        // Filter rows for this customer
        const clientNameColumnId = 1568237487449988;
        const statusColumnId = 442337580607364;
        
        const customerRows = data.rows?.filter(row => {
          const clientCell = row.cells.find(cell => cell.columnId === clientNameColumnId);
          const clientName = clientCell?.displayValue || clientCell?.value;
          return clientName === customerName;
        }) || [];

        // Calculate status counts
        const statusCountsTemp = {};
        customerRows.forEach(row => {
          const statusCell = row.cells.find(cell => cell.columnId === statusColumnId);
          const status = statusCell?.displayValue || statusCell?.value;
          if (status) {
            statusCountsTemp[status] = (statusCountsTemp[status] || 0) + 1;
          }
        });

        setStatusCounts(statusCountsTemp);
        setFilteredRows(customerRows);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [token]);

  const handleSort = (columnId) => {
    let direction = 'asc';
    if (sortConfig.key === columnId && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: columnId, direction });

    const sorted = [...filteredRows].sort((a, b) => {
      const aCell = a.cells.find(cell => cell.columnId === columnId);
      const bCell = b.cells.find(cell => cell.columnId === columnId);
      const aValue = aCell?.displayValue || aCell?.value || '';
      const bValue = bCell?.displayValue || bCell?.value || '';

      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    setFilteredRows(sorted);
  };

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

  // Column IDs from sample.json
  const columnMapping = {
    'Shipment Order': 3404207790811012,
    'Cargo Type': 3435349965334404,
    'Tonnage': 160862603896708,
    'Container Number': 3820037301135236,
    'Size': 6071837114820484,
    'Truck Number': 7197737021663108,
    'Driver Name': 4945937207977860,
    'Truck Status': 442337580607364,
    'Current Location': 8605111905216388,
    'Destination': 4101512277845892,
    'Trip Start Date': 6353312091531140,
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

  const visibleColumns = sheetData.columns?.filter(col => 
    Object.values(columnMapping).includes(col.id)
  ) || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Shipment Status Dashboard</h2>
          <p className="text-sm text-gray-500">Showing {filteredRows.length} shipments</p>
        </div>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => {
          const colorClass = getStatusColor(status);
          const bgClass = colorClass.split(' ')[0];
          const textClass = colorClass.split(' ')[1];
          
          return (
            <div key={status} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center">
                <div className={`p-3 ${bgClass} rounded-full`}>
                  <svg className={`h-5 w-5 ${textClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">{status}</h3>
                  <p className={`text-2xl font-semibold ${textClass}`}>{count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="flex justify-end">
        <div className="relative">
          <input
            type="text"
            placeholder="Search shipments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute right-3 top-2.5">🔍</span>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {visibleColumns.map((column) => (
                <th
                  key={column.id}
                  onClick={() => handleSort(column.id)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {sortConfig.key === column.id && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {visibleColumns.map((column) => {
                  const cell = row.cells.find(c => c.columnId === column.id);
                  const value = cell?.displayValue || cell?.value || '-';
                  
                  if (column.type === 'DATE') {
                    const date = value ? new Date(value).toLocaleDateString() : '-';
                    return (
                      <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {date}
                      </td>
                    );
                  }

                  if (column.title === 'Truck Status') {
                    return (
                      <td key={column.id} className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
                          {value}
                        </span>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={column.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 