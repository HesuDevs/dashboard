'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SmartsheetData() {
  const [sheetData, setSheetData] = useState({ columns: [], rows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRows, setFilteredRows] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [uniqueCustomers, setUniqueCustomers] = useState(0);
  const [uniqueTrucks, setUniqueTrucks] = useState(0);
  const [statusCounts, setStatusCounts] = useState({});
  const router = useRouter();

  useEffect(() => {
    const fetchSmartsheetData = async () => {
      try {
        const response = await fetch('/api/smartsheet');
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        console.log('Fetched data:', data); // For debugging
        setSheetData(data);
        setFilteredRows(data.rows || []);

        // Count unique customers and trucks
        const clientNameColumnId = 1568237487449988; // ID for 'Client Name' column
        const truckNumberColumnId = 7197737021663108; // ID for 'Truck Number' column
        const truckStatusColumnId = 442337580607364; // ID for 'Truck Status' column
        const uniqueCustomerSet = new Set();
        const uniqueTruckSet = new Set();
        const statusCountsTemp = {};

        data.rows?.forEach(row => {
          const clientCell = row.cells.find(cell => cell.columnId === clientNameColumnId);
          const truckCell = row.cells.find(cell => cell.columnId === truckNumberColumnId);
          const statusCell = row.cells.find(cell => cell.columnId === truckStatusColumnId);
          
          const clientName = clientCell?.displayValue || clientCell?.value;
          const truckNumber = truckCell?.displayValue || truckCell?.value;
          const status = statusCell?.displayValue || statusCell?.value;
          
          if (clientName) uniqueCustomerSet.add(clientName);
          if (truckNumber) uniqueTruckSet.add(truckNumber);
          if (status) {
            statusCountsTemp[status] = (statusCountsTemp[status] || 0) + 1;
          }
        });
        
        setUniqueCustomers(uniqueCustomerSet.size);
        setUniqueTrucks(uniqueTruckSet.size);
        setStatusCounts(statusCountsTemp);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSmartsheetData();
  }, []);

  // Search functionality
  useEffect(() => {
    if (!sheetData.rows) return;
    
    const filtered = sheetData.rows.filter(row => 
      row.cells.some(cell => 
        (cell.displayValue || cell.value || '')
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    );
    setFilteredRows(filtered);
  }, [searchTerm, sheetData.rows]);

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

  // Use all columns from the API response instead of filtering
  const visibleColumns = sheetData.columns || [];

  return (
    <div className="space-y-6">
     
      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 gap-6">
        {/* Customers Stats Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Unique Customers</h3>
              <p className="text-3xl font-semibold text-blue-600">{uniqueCustomers}</p>
            </div>
          </div>
        </div>

        {/* Trucks Stats Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Active Trucks</h3>
              <p className="text-3xl font-semibold text-green-600">{uniqueTrucks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => {
          const colorClass = getStatusColor(status);
          const bgClass = colorClass.split(' ')[0];
          const textClass = colorClass.split(' ')[1];
          
          return (
            <div key={status} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center">
                <div className={`p-3 ${bgClass} rounded-full`}>
                  <svg className={`h-5 w-5 ${textClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Transit Fleet Tracking</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search any field..."
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
      {/* Table Section with Sticky Scrollbar */}
      <div className="relative bg-white rounded-xl shadow-sm">
        {/* Top Scrollbar - Sticky */}
        <div 
          className="sticky top-0 z-10 bg-white" 
          style={{ 
            padding: '8px 0',
            borderTopLeftRadius: '0.75rem',
            borderTopRightRadius: '0.75rem',
          }}
        >
          <div 
            className="scrollbar-container-top" 
            style={{ overflowX: 'auto', overflowY: 'hidden', height: '16px', backgroundColor: '#e2e8f0' }}
            onScroll={(e) => {
              const mainTable = document.querySelector('.main-table');
              if (mainTable) {
                mainTable.scrollLeft = e.target.scrollLeft;
              }
            }}
          >
            <div style={{ width: '200%', height: '8px' }}></div>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto main-table">
          <style jsx>{`
            .scrollbar-container-top {
              overflow-x: auto;
              overflow-y: hidden;
              height: 16px;
              background-color: #e2e8f0;
              margin-bottom: -8px;
              border-radius: 4px;
            }

            .scrollbar-container-top::-webkit-scrollbar {
              height: 8px;
              background-color: #e2e8f0;
              border-radius: 4px;
            }

            .scrollbar-container-top::-webkit-scrollbar-thumb {
              background-color: #4a5568;
              border-radius: 4px;
              transition: background-color 0.2s ease;
            }

            .scrollbar-container-top::-webkit-scrollbar-thumb:hover {
              background-color: #2d3748;
            }

            .scrollbar-container-top::-webkit-scrollbar-track {
              background-color: #edf2f7;
              border-radius: 4px;
            }

            .main-table {
              overflow-x: auto;
              overflow-y: visible;
              margin-bottom: 4px;
            }

            .main-table::-webkit-scrollbar {
              height: 8px;
              background-color: #e2e8f0;
              border-radius: 4px;
            }

            .main-table::-webkit-scrollbar-thumb {
              background-color: #4a5568;
              border-radius: 4px;
              transition: background-color 0.2s ease;
            }

            .main-table::-webkit-scrollbar-thumb:hover {
              background-color: #2d3748;
            }

            .main-table::-webkit-scrollbar-track {
              background-color: #edf2f7;
              border-radius: 4px;
            }
          `}</style>
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
                <tr 
                  key={row.id} 
                  onClick={() => router.push(`/tracking/${encodeURIComponent(row.id)}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                >
                  {visibleColumns.map((column) => {
                    const cell = row.cells.find(c => c.columnId === column.id);
                    const value = cell?.displayValue || cell?.value || '-';
                    
                    if (column.type === 'DATE') {
                      let date = '-';
                      if (value && value !== '-') {
                        const dateObj = new Date(value);
                        // Check if the date is valid before formatting
                        date = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString() : '-';
                      }
                      
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
                    
                    // Truncate long text in Border Crossing Details and Remarks columns
                    if (column.title === 'Border Crossing Details' || column.title === 'Remarks') {
                      const truncatedValue = typeof value === 'string' && value.length > 50
                        ? value.substring(0, 50) + '...'
                        : value;
                      
                      return (
                        <td
                          key={column.id}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                          title={value} // Show full content on hover
                        >
                          {truncatedValue}
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

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing {filteredRows.length} of {sheetData.totalRowCount || 0} entries
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Last updated: {new Date(sheetData.modifiedAt).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
} 