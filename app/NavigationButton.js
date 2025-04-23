"use client";
import { useRouter } from "next/navigation";

function NavigationButton() {
  const router = useRouter();

  return (
    <button
    className="w-full py-4 px-45 rounded-xl bg-gradient-to-r from-blue-600 
    to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:ring-2 
    focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 
    transition-all shadow-lg shadow-blue-700/30 flex items-center justify-center"
      onClick={() => router.push("/inference")}
    >
      Inference
    </button>
  );
}

export default NavigationButton;