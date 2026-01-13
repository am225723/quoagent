"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SelectDestination() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transitType = searchParams.get("type");
  const [destination, setDestination] = useState("");

  const handleNext = () => {
    if (destination) {
      router.push(`/transit/scan?type=${transitType}&destination=${destination}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Select Destination</h1>
        <div className="flex flex-col space-y-4">
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="block w-full px-4 py-2 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="" disabled>
              Select a destination
            </option>
            <option value="Warehouse A">Warehouse A</option>
            <option value="Warehouse B">Warehouse B</option>
            <option value="Retail Store 1">Retail Store 1</option>
          </select>
          <button
            onClick={handleNext}
            disabled={!destination}
            className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
