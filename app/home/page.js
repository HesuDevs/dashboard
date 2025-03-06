'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';

const Modal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full transform transition-all">
                <div className="text-center">
                    {/* Icon */}
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
                        <span className="text-3xl">🚧</span>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        Under Development
                    </h3>
                    
                    {/* Message */}
                    <p className="text-gray-600 mb-8">
                        This module is currently under development. Stay tuned for exciting new features coming soon!
                    </p>
                    
                    {/* Button */}
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all hover:scale-105"
                    >
                        Got it, thanks!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Home() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const menuItems = [
        { 
            label: 'In Transit Tracking', 
            path: '/tracking',
            bgGradient: 'bg-gradient-to-r from-blue-500 to-cyan-400',
            icon: '🚚',
            isUnderDevelopment: false
        },
        { 
            label: 'Local Tracking', 
            path: '/tracking',
            bgGradient: 'bg-gradient-to-r from-blue-500 to-cyan-400',
            icon: '🚚',
            isUnderDevelopment: true
        },
        { 
            label: 'ICDV', 
            path: '/icdv',
            bgGradient: 'bg-gradient-to-r from-purple-500 to-pink-400',
            icon: '📊',
            isUnderDevelopment: true
        },
        { 
            label: 'AZ Nas', 
            path: '/az-nas',
            bgGradient: 'bg-gradient-to-r from-emerald-500 to-teal-400',
            icon: '🔄',
            isUnderDevelopment: true
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex flex-col items-center justify-center p-4">
            {/* Logo Section with existing animation */}
            <div className="mb-12 transform hover:scale-105 transition-transform duration-300">
                <Image
                    src="/logo.png"
                    alt="Logo"
                    width={150}
                    height={150}
                    className="rounded-2xl shadow-2xl"
                />
            </div>

            {/* Welcome Text with gradient */}
            <h1 className="text-4xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-center">
                Welcome to Dashboard
            </h1>

            {/* Enhanced Menu Buttons */}
            <div className="flex flex-wrap justify-center gap-8 max-w-4xl">
                {menuItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            if (item.isUnderDevelopment) {
                                setIsModalOpen(true);
                            } else {
                                router.push(item.path);
                            }
                        }}
                        className={`
                            w-72 p-8 
                            ${item.bgGradient}
                            rounded-2xl 
                            shadow-lg hover:shadow-2xl 
                            transform hover:scale-105 
                            transition-all duration-300 
                            flex flex-col items-center 
                            justify-center space-y-4
                            group
                        `}
                    >
                        <span className="text-5xl mb-2 transform group-hover:scale-110 transition-transform duration-200">
                            {item.icon}
                        </span>
                        <span className="text-2xl font-bold text-white">
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Footer Text */}
            <div className="mt-12 text-gray-600 text-center">
                <p className="text-sm">Select a module to continue</p>
            </div>

            {/* Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}