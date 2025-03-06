'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

export default function TripDetail({ params }) {
    const unwrappedParams = use(params);
    const tripId = decodeURIComponent(unwrappedParams.tripId);
    const router = useRouter();
    const [tripData, setTripData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Update the columnMapping to include ALL columns
    const columnMapping = {
        // Shipment Details
        'Shipment Order': 3404207790811012,
        'Transport Company': 4664462231267204,
        'Client Name': 1568237487449988,
        'Trip Start Date': 6353312091531140,
        'Trip End Date': 8323437928447876,
        'Trip Duration': 5789838301077380,
        
        // Vehicle & Driver Details
        'Truck Number': 7197737021663108,
        'Driver Name': 4945937207977860,
        'Driver Phone': 2693637394292612,
        'Truck Status': 442337580607364,
        
        // Cargo Details
        'Cargo Type': 3435349965334404,
        'Container Number': 3820037301135236,
        'Size': 6071837114820484,
        'Tonnage': 160862603896708,
        'Seal Number': 7479612834749316,
        
        // Route Information
        'Origin': 5070062742105988,
        'Current Location': 8605111905216388,
        'Destination': 4101512277845892,
        'Border Post': 1849712464160644,
        'Distance': 7916012277531524,
        
        // Documentation
        'Import Declaration': 3412412650161028,
        'Export Declaration': 5664212463846276,
        'RIT Number': 2130612836475780,
        
        // Additional Information
        'Trip Updates': 2412662417581956,
        'Comments': 4382787742894980,
        'Last Updated': 6634587556580228
    };

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
                setLoading(false);
            } catch (error) {
                console.error('Error fetching trip data:', error);
                setLoading(false);
            }
        };

        fetchTripData();
    }, [tripId]);

    // Helper function to get cell value by column ID
    const getCellValue = (columnId) => {
        const cell = tripData?.cells.find(c => c.columnId === columnId);
        return cell?.displayValue || cell?.value || '-';
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

    // Parse trip updates into array
    const getTripUpdates = () => {
        const updates = getCellValue(columnMapping['Trip Updates']);
        return updates !== '-' ? updates.split('\n') : [];
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

    const status = getCellValue(columnMapping['Truck Status']);
    const statusColorClass = getStatusColor(status);

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

            {/* Enhanced Trip Header */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Shipment Order: {getCellValue(columnMapping['Shipment Order'])}
                        </h1>
                        <div className="mt-2 space-y-1">
                            <p className="text-gray-600">
                                Client: {getCellValue(columnMapping['Client Name'])}
                            </p>
                            <p className="text-gray-600">
                                Transport Company: {getCellValue(columnMapping['Transport Company'])}
                            </p>
                            <p className="text-gray-600">
                                Last Updated: {new Date(getCellValue(columnMapping['Last Updated'])).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full ${getStatusColor(getCellValue(columnMapping['Truck Status']))}`}>
                        {getCellValue(columnMapping['Truck Status'])}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Vehicle & Driver Information */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">Vehicle & Driver Information</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-500">Truck Number</label>
                            <p className="text-gray-900 font-medium">{getCellValue(columnMapping['Truck Number'])}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Driver Name</label>
                            <p className="text-gray-900 font-medium">{getCellValue(columnMapping['Driver Name'])}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Driver Phone</label>
                            <p className="text-gray-900 font-medium">{getCellValue(columnMapping['Driver Phone'])}</p>
                        </div>
                    </div>
                </div>

                {/* Cargo Information */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">Cargo Information</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-500">Cargo Type</label>
                            <p className="text-gray-900 font-medium">{getCellValue(columnMapping['Cargo Type'])}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Container Number</label>
                            <p className="text-gray-900 font-medium">{getCellValue(columnMapping['Container Number'])}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Size</label>
                            <p className="text-gray-900 font-medium">{getCellValue(columnMapping['Size'])}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Tonnage</label>
                            <p className="text-gray-900 font-medium">{getCellValue(columnMapping['Tonnage'])}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Seal Number</label>
                            <p className="text-gray-900 font-medium">{getCellValue(columnMapping['Seal Number'])}</p>
                        </div>
                    </div>
                </div>

                {/* Route Information */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">Route Information</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-500">Origin</label>
                            <p className="text-gray-900 font-medium">{getCellValue(columnMapping['Origin'])}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Current Location</label>
                            <p className="text-gray-900 font-medium">{getCellValue(columnMapping['Current Location'])}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Destination</label>
                            <p className="text-gray-900 font-medium">{getCellValue(columnMapping['Destination'])}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Border Post</label>
                            <p className="text-gray-900 font-medium">{getCellValue(columnMapping['Border Post'])}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Distance</label>
                            <p className="text-gray-900 font-medium">{getCellValue(columnMapping['Distance'])} km</p>
                        </div>
                    </div>
                </div>

                {/* Trip Timing */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">Trip Timing</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-500">Start Date</label>
                            <p className="text-gray-900 font-medium">
                                {new Date(getCellValue(columnMapping['Trip Start Date'])).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">End Date</label>
                            <p className="text-gray-900 font-medium">
                                {getCellValue(columnMapping['Trip End Date']) !== '-' 
                                    ? new Date(getCellValue(columnMapping['Trip End Date'])).toLocaleString()
                                    : '-'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Duration</label>
                            <p className="text-gray-900 font-medium">{getCellValue(columnMapping['Trip Duration'])}</p>
                        </div>
                    </div>
                </div>

                {/* Documentation */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">Documentation</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-500">Import Declaration</label>
                            <p className="text-gray-900 font-medium">{getCellValue(columnMapping['Import Declaration'])}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Export Declaration</label>
                            <p className="text-gray-900 font-medium">{getCellValue(columnMapping['Export Declaration'])}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">RIT Number</label>
                            <p className="text-gray-900 font-medium">{getCellValue(columnMapping['RIT Number'])}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Comments</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{getCellValue(columnMapping['Comments'])}</p>
            </div>

            {/* Trip Updates Timeline */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Trip Updates</h2>
                <div className="space-y-4">
                    {getTripUpdates().map((update, index) => (
                        <div key={index} className="flex items-start">
                            <div className="flex-shrink-0 h-4 w-4 rounded-full bg-blue-500 mt-2"></div>
                            <div className="ml-4">
                                <p className="text-gray-900">{update}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 