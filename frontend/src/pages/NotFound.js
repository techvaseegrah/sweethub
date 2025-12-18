import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200 text-gray-800 text-center">
      <div>
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-xl mt-4">Page Not Found</p>
        <p className="mt-2">The page you are looking for does not exist.</p>
        <Link to="/" className="mt-6 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
          Go to Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;