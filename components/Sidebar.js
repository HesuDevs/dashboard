"use client"
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const getMenuItems = (isAdmin) => {
  const baseItems = [
    { icon: '🚢', label: 'Tracking', href: '/tracking' },
    { icon: '👥', label: 'Customers', href: '/tracking/customers' },
  ];

  

  return [
    ...baseItems,
 //   { icon: '👤', label: 'Profile', href: '/dashboard/profile' },
  ];
};

export default function Sidebar() {
  const pathname = usePathname();
  // TODO: Replace with actual auth check
  const isAdmin = false; // Set to false for customer view

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200">
      {/* Logo Section */}
      <div className="p-4 flex flex-col items-center border-b">
        <Image
          src="/logo.png"
          alt="Hesu Logo"
          width={120}
          height={120}
          className="mb-2"
        />
        <h1 className="text-xl font-bold text-blue-600">Hesu Tracking</h1>
        <p className="text-sm text-gray-500 mt-1">In Transit</p>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4">
        {getMenuItems(isAdmin).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center space-x-3 p-3 rounded-lg mb-2 ${
              pathname === item.href
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
} 