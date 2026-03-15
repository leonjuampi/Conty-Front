
interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  icon: string;
  color: string;
}

export function StatCard({ title, value, change = '', icon, color }: StatCardProps) {
  const isPositive = change.startsWith('+');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-gradient-to-br ${color} rounded-lg shadow-sm`}>
          <i className={`${icon} text-white text-xl md:text-2xl`}></i>
        </div>
        {change && (
          <span className={`text-xs md:text-sm font-semibold px-2 py-1 rounded-full ${
            isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {change}
          </span>
        )}
      </div>
      <h3 className="text-xs md:text-sm text-gray-600 mb-1">{title}</h3>
      <p className="text-xl md:text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}