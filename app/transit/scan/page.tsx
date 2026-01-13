"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface ScannedItem {
  tagId: string;
  state: string;
  date: string;
  time: string;
}

export default function ScanTransit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transitType = searchParams.get("type");
  const destination = searchParams.get("destination");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);

  // Mock scanning
  useEffect(() => {
    const mockScan = () => {
      const newItem: ScannedItem = {
        tagId: `RFID-${Math.random().toString(36).substr(2, 9)}`,
        state: "Scanned",
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      };
      setScannedItems((prevItems) => [...prevItems, newItem]);
    };

    const interval = setInterval(mockScan, 3000); // New item every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const handleConfirm = () => {
    const items = JSON.stringify(scannedItems);
    router.push(
      `/transit/confirmation?type=${transitType}&destination=${destination}&items=${items}`
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-center">Scan Transit</h1>
        <div className="mb-4">
          <p>
            <strong>Type:</strong> {transitType}
          </p>
          <p>
            <strong>Destination:</strong> {destination}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Tag ID</th>
                <th className="px-4 py-2 border">State</th>
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Time</th>
              </tr>
            </thead>
            <tbody>
              {scannedItems.map((item) => (
                <tr key={item.tagId}>
                  <td className="px-4 py-2 border">{item.tagId}</td>
                  <td className="px-4 py-2 border">{item.state}</td>
                  <td className="px-4 py-2 border">{item.date}</td>
                  <td className="px-4 py-2 border">{item.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={handleConfirm}
            className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
