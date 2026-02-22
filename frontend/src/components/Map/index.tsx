import dynamic from "next/dynamic";

// Dynamically import the map to avoid 'window is not defined' during SSR
const LiveMap = dynamic(() => import("./LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-slate-100 animate-pulse flex items-center justify-center text-gray-400 rounded-lg">
      <div className="flex flex-col items-center">
        <svg className="w-10 h-10 mb-2 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="font-semibold">Loading Map Engine...</span>
      </div>
    </div>
  ),
});

export default LiveMap;
export type { MapUser } from "./LiveMap";
