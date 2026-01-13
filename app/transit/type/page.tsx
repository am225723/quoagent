
"use client";

import { useRouter } from "next/navigation";
import { useTransit } from "../TransitContext";
import { useEffect } from "react";

export default function SelectTransitType() {
  const router = useRouter();
  const { setTransitType, resetTransit } = useTransit();

  useEffect(() => {
    resetTransit();
  }, []);

  const handleSelect = (type: string) => {
    setTransitType(type);
    router.push(`/transit/destination`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Select Transit Type</h1>
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => handleSelect("Check In")}
            className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
          >
            Check In
          </button>
          <button
            onClick={() => handleSelect("Check Out")}
            className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
          >
            Check Out
          </button>
          <button
            onClick={() => handleSelect("Dispose")}
            className="px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700"
          >
            Dispose
          </button>
        </div>
      </div>
    </div>
  );
}
