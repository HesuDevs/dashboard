'use client';
import { useState, useEffect } from 'react';
import { use } from 'react';
import * as XLSX from 'xlsx';

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
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDateRange, setExportDateRange] = useState({
    startDate: '',
    endDate: '',
    exportAll: true
  });

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

  // Updated columnMapping without Shipment Order
  const columnMapping = {
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

  // Add this new function to handle Excel export
  const exportToExcel = () => {
    const rowsToExport = filterRowsByDateRange(filteredRows);
    const excelData = rowsToExport.map(row => {
      const rowData = {};
      visibleColumns.forEach(column => {
        const cell = row.cells.find(c => c.columnId === column.id);
        let value = cell?.displayValue || cell?.value || '-';
        
        if (column.type === 'DATE' && value !== '-') {
          value = new Date(value).toLocaleDateString();
        }
        
        rowData[column.title] = value;
      });
      return rowData;
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Shipments');

    const dateRangeStr = exportDateRange.exportAll ? 'all' : 
      `${exportDateRange.startDate}_to_${exportDateRange.endDate}`;
    const fileName = `shipments_${dateRangeStr}.xlsx`;

    XLSX.writeFile(wb, fileName);
    setShowExportModal(false);
  };

  // Add this function to filter rows by date range
  const filterRowsByDateRange = (rows) => {
    if (exportDateRange.exportAll) return rows;

    return rows.filter(row => {
      const cell = row.cells.find(c => c.columnId === columnMapping['Trip Start Date']);
      const tripDate = cell?.value ? new Date(cell.value) : null;
      if (!tripDate) return false;

      const start = exportDateRange.startDate ? new Date(exportDateRange.startDate) : null;
      const end = exportDateRange.endDate ? new Date(exportDateRange.endDate) : null;

      if (start && end) {
        return tripDate >= start && tripDate <= end;
      }
      return true;
    });
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

  // Add the Export Modal Component
  const ExportModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Export Shipments</h3>
          <button
            onClick={() => setShowExportModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="exportAll"
              checked={exportDateRange.exportAll}
              onChange={(e) => setExportDateRange({
                ...exportDateRange,
                exportAll: e.target.checked
              })}
              className="rounded text-blue-600"
            />
            <label htmlFor="exportAll">Export all records</label>
          </div>

          {!exportDateRange.exportAll && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={exportDateRange.startDate}
                  onChange={(e) => setExportDateRange({
                    ...exportDateRange,
                    startDate: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={exportDateRange.endDate}
                  onChange={(e) => setExportDateRange({
                    ...exportDateRange,
                    endDate: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowExportModal(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Shipment Status Dashboard</h2>
          <p className="text-sm text-gray-500">Showing {filteredRows.length} shipments</p>
        </div>
        
        {/* Add Export Button */}
        <button
          onClick={() => setShowExportModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          <span>Export to Excel</span>
        </button>
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

      {/* Update the search bar container to include both search and export */}
      <div className="flex justify-between items-center">
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

      {/* Shipments Table with custom scrollbar */}
      <div className="bg-white rounded-xl shadow-sm">
        {/* Top Scrollbar */}
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
        {/* Table Container */}
        <div 
          className="overflow-x-auto scrollbar-container main-table" 
          onScroll={(e) => {
            const topScrollbar = document.querySelector('.scrollbar-container-top');
            if (topScrollbar) {
              topScrollbar.scrollLeft = e.target.scrollLeft;
            }
          }}
        >
          <style jsx>{`
            .scrollbar-container-top {
              overflow-x: auto;
              overflow-y: hidden;
              height: 16px;
              background-color: #e2e8f0;
              margin-bottom: -8px;
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
          <table className="w-full min-w-max">
            <thead className="bg-gray-50">
              <tr>
                {visibleColumns.map((column) => (
                  <th
                    key={column.id}
                    onClick={() => handleSort(column.id)}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 sticky top-0 bg-gray-50"
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

      {/* Add the modal to the main return statement */}
      {showExportModal && <ExportModal />}
    </div>
  );
} 