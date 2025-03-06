export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800"></h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full text-white flex items-center justify-center">
              EK
            </div>
            <span className="text-gray-600">Elvin Kakomo</span>
          </div>
        </div>
      </div>
    </header>
  );
} 