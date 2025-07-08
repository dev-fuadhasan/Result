export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Fast Result Checker</h4>
            <p className="text-sm text-gray-600">
              Reliable result checking for Bangladesh education boards with optimized performance during peak times.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Supported Boards</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>All General Education Boards</li>
              <li>Madrasah Education Board</li>
              <li>Technical Education Board</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">System Features</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>Multiple retry mechanisms</li>
              <li>Real-time error handling</li>
              <li>Mobile-optimized interface</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-6 pt-6 text-center text-sm text-gray-600">
          <p>&copy; 2024 Fast Result Checker. Designed for students of Bangladesh. Not affiliated with official education boards.</p>
        </div>
      </div>
    </footer>
  );
}
