"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface ScannedItem {
  tagId: string;
  state: string;
  date: string;
  time: string;
}

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transitType = searchParams.get("type");
  const destination = searchParams.get("destination");
  const itemsParam = searchParams.get("items");
  const scannedItems: ScannedItem[] = itemsParam ? JSON.parse(itemsParam) : [];

  const handleDone = () => {
    router.push("/transit/type");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-center">Confirmation</h1>
        <div className="mb-4">
          <p>
            <strong>Type:</strong> {transitType}
          </p>
          <p>
            <strong>Destination:</strong> {destination}
          </p>
        </div>
        <h2 className="mb-2 text-xl font-semibold">Scanned Items</h2>
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
            onClick={handleDone}
            className="px-4 py-2 font-bold text-white bg-green-500 rounded hover:bg-green-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Confirmation() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
