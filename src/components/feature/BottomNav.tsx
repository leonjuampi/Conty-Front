import { useLocation, useNavigate } from 'react-router-dom';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', icon: 'ri-dashboard-line', label: 'Dashboard' },
    { path: '/orders', icon: 'ri-shopping-cart-line', label: 'Pedidos' },
    { path: '/cash', icon: 'ri-safe-line', label: 'Caja' },
    { path: '/clients', icon: 'ri-group-line', label: 'Clientes' },
    { path: '/reports', icon: 'ri-bar-chart-box-line', label: 'Reportes' }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all cursor-pointer min-w-0 flex-1 ${
                isActive
                  ? 'text-orange-500'
                  : 'text-gray-500'
              }`}
            >
              <i className={`${item.icon} text-xl`}></i>
              <span className="text-xs font-medium truncate w-full text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}