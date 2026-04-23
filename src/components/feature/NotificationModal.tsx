import ReactMarkdown from 'react-markdown';
import { useNotifications } from '../../context/NotificationContext';

export function NotificationModal() {
  const { notifications, showModal, dismissModal, handleMarkAllAsRead } = useNotifications();
  if (!showModal) return null;

  const unread = notifications.filter(n => !n.is_read);

  const handleClose = () => {
    handleMarkAllAsRead();
    dismissModal();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <i className="ri-notification-3-line text-2xl"></i>
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">¡Hay novedades!</h2>
              <p className="text-sm text-white/80">{unread.length} novedad{unread.length !== 1 ? 'es' : ''} nueva{unread.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
          {unread.map(n => (
            <div key={n.id} className="px-6 py-4">
              <p className="font-semibold text-gray-800 text-sm">{n.title}</p>
              <div className="text-sm text-gray-600 mt-1 prose prose-sm max-w-none [&_img]:rounded-xl [&_img]:max-w-full [&_p]:my-1">
                <ReactMarkdown>{n.body}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold py-2.5 rounded-xl transition-all cursor-pointer text-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
