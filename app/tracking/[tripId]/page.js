'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

export default function TripDetail({ params }) {
    const unwrappedParams = use(params);
    const tripId = decodeURIComponent(unwrappedParams.tripId);
    const router = useRouter();
    const [tripData, setTripData] = useState(null);
    const [allColumns, setAllColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState({});

    useEffect(() => {
        const fetchTripData = async () => {
            try {
                const response = await fetch('/api/smartsheet');
                const data = await response.json();
                // Convert tripId to string for comparison since IDs in sample.json are strings
                const trip = data.rows.find(row => row.id.toString() === tripId.toString());
                
                if (!trip) {
                    console.log('Trip ID from URL:', tripId);
                    console.log('Available trip IDs:', data.rows.map(row => row.id));
                }
                
                setTripData(trip);
                setAllColumns(data.columns || []);
                
                // Calculate KPIs after setting data
                if (trip) {
                    calculateKPIs(trip, data.columns);
                }
                
                setLoading(false);
            } catch (error) {
                console.error('Error fetching trip data:', error);
                setLoading(false);
            }
        };

        fetchTripData();
    }, [tripId]);

    // Calculate KPIs from trip data
    const calculateKPIs = (trip, columns) => {
        const kpiData = {};
        
        // Find column IDs by title
        const findColumnId = (title) => {
            const column = columns.find(col => col.title === title);
            return column ? column.id : null;
        };
        
        // Get cell value helper
        const getCellValueById = (columnId) => {
            if (!columnId) return null;
            const cell = trip.cells.find(c => c.columnId === columnId);
            return cell?.displayValue || cell?.value || null;
        };
        
        // Find important column IDs
        const startDateId = findColumnId('Trip Start Date');
        const endDateId = findColumnId('Trip End Date');
        const distanceId = findColumnId('Distance');
        const statusId = findColumnId('Truck Status');
        const originId = findColumnId('Origin');
        const destinationId = findColumnId('Destination');
        
        // Trip Duration calculation
        if (startDateId && endDateId) {
            const startDate = getCellValueById(startDateId);
            const endDate = getCellValueById(endDateId);
            
            if (startDate) {
                const start = new Date(startDate);
                
                if (endDate) {
                    const end = new Date(endDate);
                    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                        const durationMs = end - start;
                        const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24));
                        kpiData.tripDuration = {
                            value: durationDays,
                            unit: 'days',
                            label: 'Trip Duration'
                        };
                    }
                } else {
                    // If trip is not complete, calculate elapsed time
                    const now = new Date();
                    if (!isNaN(start.getTime())) {
                        const elapsedMs = now - start;
                        const elapsedDays = Math.round(elapsedMs / (1000 * 60 * 60 * 24));
                        kpiData.elapsedTime = {
                            value: elapsedDays,
                            unit: 'days',
                            label: 'Elapsed Time'
                        };
                    }
                }
            }
        }
        
        // Delivery Status
        if (statusId) {
            const status = getCellValueById(statusId);
            if (status) {
                const isCompleted = status === 'Delivered';
                const isInTransit = status.includes('Moving') || status.includes('Waiting');
                
                kpiData.deliveryStatus = {
                    value: status,
                    isCompleted,
                    isInTransit,
                    label: 'Delivery Status'
                };
            }
        }
        
        // Journey Information
        if (originId && destinationId) {
            const origin = getCellValueById(originId);
            const destination = getCellValueById(destinationId);
            
            if (origin && destination) {
                kpiData.journey = {
                    origin,
                    destination,
                    label: 'Journey'
                };
            }
        }
        
        // Distance
        if (distanceId) {
            const distance = getCellValueById(distanceId);
            if (distance && !isNaN(parseFloat(distance))) {
                kpiData.distance = {
                    value: parseFloat(distance),
                    unit: 'km',
                    label: 'Total Distance'
                };
            }
        }
        
        setKpis(kpiData);
    };

    // Helper function to get cell value by column ID
    const getCellValue = (columnId) => {
        const cell = tripData?.cells.find(c => c.columnId === columnId);
        return cell?.displayValue || cell?.value || '-';
    };

    // Helper function to get cell value with proper date formatting
    const getFormattedCellValue = (column) => {
        const cell = tripData?.cells.find(c => c.columnId === column.id);
        const value = cell?.displayValue || cell?.value || '-';

        if (column.type === 'DATE') {
            if (value && value !== '-') {
                const dateObj = new Date(value);
                return !isNaN(dateObj.getTime()) ? dateObj.toLocaleString() : '-';
            }
            return '-';
        }
        
        return value;
    };

    // Helper function to get status color
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

    if (!tripData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    Trip not found
                </div>
            </div>
        );
    }

    // Find important columns
    const getColumnByTitle = (title) => allColumns.find(col => col.title === title);
    
    const shipmentOrderColumn = getColumnByTitle('Shipment Order');
    const clientNameColumn = getColumnByTitle('Client Name');
    const transportCompanyColumn = getColumnByTitle('Transport Company');
    const statusColumn = getColumnByTitle('Truck Status');
    const lastUpdatedColumn = getColumnByTitle('Last Updated');
    
    const status = statusColumn ? getCellValue(statusColumn.id) : '-';
    const statusColorClass = getStatusColor(status);

    // Group columns by category
    const columnGroups = {
        vehicleAndDriver: [
            'Truck Number', 
            'Driver Name', 
            'Driver Phone'
        ],
        cargoDetails: [
            'Cargo Type', 
            'Container Number', 
            'Size', 
            'Tonnage', 
            'Seal Number'
        ],
        routeAndLocation: [
            'Origin', 
            'Current Location', 
            'Destination', 
            'Border Post', 
            'Distance'
        ],
        timing: [
            'Trip Start Date', 
            'Trip End Date', 
            'Trip Duration'
        ],
        documentation: [
            'Import Declaration', 
            'Export Declaration', 
            'RIT Number',
            'Border Crossing Details'
        ],
        updates: [
            'Trip Updates', 
            'Comments',
            'Remarks'
        ]
    };

    // Function to check if column belongs to a group
    const getColumnGroup = (columnTitle) => {
        for (const [group, titles] of Object.entries(columnGroups)) {
            if (titles.includes(columnTitle)) {
                return group;
            }
        }
        return 'other';
    };

    // Organize columns by group
    const groupedColumns = {};
    allColumns.forEach(column => {
        const group = getColumnGroup(column.title);
        if (!groupedColumns[group]) {
            groupedColumns[group] = [];
        }
        groupedColumns[group].push(column);
    });

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
            >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Tracking
            </button>

            {/* Trip Header */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Shipment Order: {shipmentOrderColumn ? getCellValue(shipmentOrderColumn.id) : tripId}
                        </h1>
                        <div className="mt-2 space-y-1">
                            {clientNameColumn && (
                                <p className="text-gray-600">
                                    Client: {getCellValue(clientNameColumn.id)}
                                </p>
                            )}
                            {transportCompanyColumn && (
                                <p className="text-gray-600">
                                    Transport Company: {getCellValue(transportCompanyColumn.id)}
                                </p>
                            )}
                            {lastUpdatedColumn && (
                                <p className="text-gray-600">
                                    Last Updated: {getFormattedCellValue(lastUpdatedColumn)}
                                </p>
                            )}
                        </div>
                    </div>
                    {statusColumn && (
                        <div className={`px-4 py-2 rounded-full ${statusColorClass}`}>
                            {status}
                        </div>
                    )}
                </div>
            </div>

            {/* KPI Dashboard */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Key Performance Indicators</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {kpis.tripDuration && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-blue-800">Trip Duration</h3>
                            <p className="text-2xl font-bold text-blue-600">{kpis.tripDuration.value} {kpis.tripDuration.unit}</p>
                        </div>
                    )}
                    
                    {kpis.elapsedTime && !kpis.tripDuration && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-blue-800">Time Elapsed</h3>
                            <p className="text-2xl font-bold text-blue-600">{kpis.elapsedTime.value} {kpis.elapsedTime.unit}</p>
                        </div>
                    )}
                    
                    {kpis.deliveryStatus && (
                        <div className={`p-4 rounded-lg ${kpis.deliveryStatus.isCompleted ? 'bg-green-50' : 'bg-yellow-50'}`}>
                            <h3 className={`text-sm font-medium ${kpis.deliveryStatus.isCompleted ? 'text-green-800' : 'text-yellow-800'}`}>
                                Status
                            </h3>
                            <p className={`text-2xl font-bold ${kpis.deliveryStatus.isCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
                                {kpis.deliveryStatus.value}
                            </p>
                        </div>
                    )}
                    
                    {kpis.distance && (
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-purple-800">Total Distance</h3>
                            <p className="text-2xl font-bold text-purple-600">{kpis.distance.value} {kpis.distance.unit}</p>
                        </div>
                    )}
                    
                    {kpis.journey && (
                        <div className="bg-indigo-50 p-4 rounded-lg col-span-3">
                            <h3 className="text-sm font-medium text-indigo-800">Journey</h3>
                            <p className="text-xl font-bold text-indigo-600">
                                {kpis.journey.origin} → {kpis.journey.destination}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Vehicle & Driver Information */}
            {groupedColumns.vehicleAndDriver && groupedColumns.vehicleAndDriver.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">Vehicle & Driver Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {groupedColumns.vehicleAndDriver.map(column => (
                            <div key={column.id} className="space-y-1">
                                <label className="text-sm text-gray-500">{column.title}</label>
                                <p className="text-gray-900 font-medium">
                                    {getFormattedCellValue(column)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cargo Details */}
            {groupedColumns.cargoDetails && groupedColumns.cargoDetails.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">Cargo Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {groupedColumns.cargoDetails.map(column => (
                            <div key={column.id} className="space-y-1">
                                <label className="text-sm text-gray-500">{column.title}</label>
                                <p className="text-gray-900 font-medium">
                                    {getFormattedCellValue(column)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Route Information */}
            {groupedColumns.routeAndLocation && groupedColumns.routeAndLocation.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">Route Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {groupedColumns.routeAndLocation.map(column => (
                            <div key={column.id} className="space-y-1">
                                <label className="text-sm text-gray-500">{column.title}</label>
                                <p className="text-gray-900 font-medium">
                                    {getFormattedCellValue(column)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trip Timing */}
            {groupedColumns.timing && groupedColumns.timing.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">Trip Timing</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {groupedColumns.timing.map(column => (
                            <div key={column.id} className="space-y-1">
                                <label className="text-sm text-gray-500">{column.title}</label>
                                <p className="text-gray-900 font-medium">
                                    {getFormattedCellValue(column)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Documentation */}
            {groupedColumns.documentation && groupedColumns.documentation.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">Documentation</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {groupedColumns.documentation.map(column => (
                            <div key={column.id} className="space-y-1">
                                <label className="text-sm text-gray-500">{column.title}</label>
                                {column.title === 'Border Crossing Details' ? (
                                    <p className="text-gray-900 font-medium whitespace-pre-wrap">
                                        {getFormattedCellValue(column)}
                                    </p>
                                ) : (
                                    <p className="text-gray-900 font-medium">
                                        {getFormattedCellValue(column)}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trip Updates & Comments */}
            {groupedColumns.updates && groupedColumns.updates.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">Trip Updates & Comments</h2>
                    <div className="space-y-4">
                        {groupedColumns.updates.map(column => (
                            <div key={column.id} className="space-y-1">
                                <label className="text-sm text-gray-500">{column.title}</label>
                                <p className="text-gray-900 font-medium whitespace-pre-wrap">
                                    {getFormattedCellValue(column)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Other Information */}
            {groupedColumns.other && groupedColumns.other.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">Additional Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {groupedColumns.other.map(column => (
                            <div key={column.id} className="space-y-1">
                                <label className="text-sm text-gray-500">{column.title}</label>
                                <p className="text-gray-900 font-medium">
                                    {getFormattedCellValue(column)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
} 