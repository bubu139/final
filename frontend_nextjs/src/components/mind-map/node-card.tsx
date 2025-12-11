// components/NodeCard.tsx
'use client';

interface NodeCardProps {
  label: string;
  status: "not_started" | "learning" | "mastered";
  score?: number;
  onClick: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "mastered": return "bg-green-500 text-white";
    case "learning": return "bg-yellow-400 text-black";
    default: return "bg-blue-500 text-white";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "learning": return "Đang học";
    case "mastered": return "Hoàn thành";
    default: return "Chưa học";
  }
};

export function NodeCard({ label, status, score, onClick }: NodeCardProps) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl p-6 shadow-md transition transform hover:scale-105 ${getStatusColor(status)}`}
    >
      <h2 className="text-lg font-semibold">{label}</h2>
      <p className="opacity-80 text-sm mt-1">Trạng thái: {getStatusText(status)}</p>
      {score !== undefined && score > 0 && (
        <p className="opacity-80 text-sm mt-1">Điểm cao nhất: {Math.round(score)}%</p>
      )}
    </div>
  );
}
