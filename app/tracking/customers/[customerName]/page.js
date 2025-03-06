'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

export default function CustomerDetail({ params }) {
  
  const unwrappedParams = use(params);
  const customerName = decodeURIComponent(unwrappedParams.customerName);
  const [sheetData, setSheetData] = useState({ columns: [], rows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredRows, setFilteredRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showShareModal, setShowShareModal] = useState(false);
  const router = useRouter();
 // const customerName = decodeURIComponent(params.customerName);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const response = await fetch('/api/smartsheet');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        setSheetData(data);

        // Filter rows for this customer
        const clientNameColumnId = 1568237487449988; // ID for 'Client Name' column
        const customerRows = data.rows?.filter(row => {
          const clientCell = row.cells.find(cell => cell.columnId === clientNameColumnId);
          const clientName = clientCell?.displayValue || clientCell?.value;
          return clientName === customerName;
        }) || [];

        setFilteredRows(customerRows);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [customerName]);

  // Search functionality
  useEffect(() => {
    if (!sheetData.rows) return;
    
    const customerRows = sheetData.rows.filter(row => {
      const clientCell = row.cells.find(cell => cell.columnId === 1568237487449988);
      return (clientCell?.displayValue || clientCell?.value) === customerName;
    });

    const searchFiltered = customerRows.filter(row => 
      row.cells.some(cell => 
        (cell.displayValue || cell.value || '')
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    );
    setFilteredRows(searchFiltered);
  }, [searchTerm, sheetData.rows, customerName]);

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

  // Generate shareable link
  const getShareableLink = () => {
    const token = btoa(customerName); // Simple encoding - in production use a more secure method
    return `${window.location.origin}/shared/${token}`;
  };

  // Modal component for sharing
  const ShareModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full m-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Share Dashboard</h3>
          <button
            onClick={() => setShowShareModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Share this link with your customer to give them access to their shipment dashboard:
          </p>
          <div className="flex space-x-2">
            <input
              type="text"
              readOnly
              value={getShareableLink()}
              className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(getShareableLink());
                alert('Link copied to clipboard!');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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

  const visibleColumns = sheetData.columns?.filter(col => 
    Object.values(columnMapping).includes(col.id)
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">{customerName}</h2>
            <p className="text-sm text-gray-500">Showing {filteredRows.length} shipments</p>
          </div>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowShareModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Share Link</span>
          </button>
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
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {showShareModal && <ShareModal />}

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