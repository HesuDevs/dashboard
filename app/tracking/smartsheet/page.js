'use client';
import { useState, useEffect } from 'react';

export default function SmartsheetData() {
  const [sheetData, setSheetData] = useState({ columns: [], rows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRows, setFilteredRows] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

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

  // Column IDs from sample.json
  const columnMapping = {
    'Shipment Order': 3404207790811012,
    'Cargo Type': 3435349965334404,
    'Tonnage': 160862603896708,
    'Container Number': 3820037301135236,
    'Size': 6071837114820484,
    'Client Name': 1568237487449988,
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