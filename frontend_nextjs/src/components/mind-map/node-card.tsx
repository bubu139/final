"use client";

interface NodeCardProps {
  label: string;
  status: "not_started" | "in_progress" | "completed";
  onClick: () => void;
}



// Hàm đổi màu node theo trạng thái
const getStatusColor = (status: string) => {
  switch (status) {
    case "mastered":
      return "bg-green-500 text-white";
    case "learning":
      return "bg-yellow-400 text-black";
    default:
      return "bg-blue-500 text-white";
  }
};


export function NodeCard({ label, status, onClick }: NodeCardProps) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl p-6 shadow-md transition transform hover:scale-105 ${getStatusColor(
        status
      )}`}
    >
      <h2 className="text-lg font-semibold">{label}</h2>

      <p className="opacity-80 text-sm mt-1">
  Trạng thái: 
  {status === "not_started"
    ? "Chưa học"
    : status === "in_progress"
    ? "Đang học"
    : "Hoàn thành"}
</p>

    </div>
  );
}
