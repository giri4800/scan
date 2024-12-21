import React from 'react';

export default function History() {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Analysis History</h2>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Analysis #{i}</p>
                <p className="mt-1 text-lg font-semibold">Result: No concerns detected</p>
                <p className="mt-1 text-sm text-gray-600">Confidence Score: 98%</p>
              </div>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}