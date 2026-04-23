import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNotifications } from '../../context/NotificationContext';

export function NotificationBell({ dark = false }: { dark?: boolean }) {
  const { notifications, unreadCount, handleMarkAsRead, handleMarkAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
          dark
            ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        title="Novedades"
      >
        <i className="ri-notification-3-line text-xl"></i>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-[200] overflow-hidden ${dark ? 'left-0 bottom-full mb-2' : 'right-0 mt-2'}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-800 text-sm">Novedades</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-brand-500 hover:underline cursor-pointer"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Sin novedades por ahora</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                  onClick={() => { if (!n.is_read) handleMarkAsRead(n.id); }}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="mt-1.5 w-2 h-2 bg-brand-500 rounded-full shrink-0"></span>}
                    <div className={!n.is_read ? '' : 'pl-4'}>
                      <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                      <div className="text-xs text-gray-600 mt-0.5 prose prose-xs max-w-none [&_img]:rounded-lg [&_img]:max-w-full [&_p]:my-0.5">
                        <ReactMarkdown>{n.body}</ReactMarkdown>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
