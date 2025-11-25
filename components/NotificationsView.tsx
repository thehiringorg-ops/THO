
import React from 'react';
import { User, UserNotification } from '../types';
import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface NotificationsViewProps {
  currentUser: User | null;
  onMarkAsRead: (notificationId: string) => void;
  onClearAll: () => void;
  onDeleteNotification: (notificationId: string) => void;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ currentUser, onMarkAsRead, onClearAll, onDeleteNotification }) => {
  const notifications = currentUser?.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: UserNotification['type']) => {
      switch(type) {
          case 'Alert': return <AlertTriangle size={20} className="text-red-500"/>;
          case 'Info': return <Info size={20} className="text-blue-500"/>;
          case 'System': return <Bell size={20} className="text-orange-500"/>;
          default: return <Bell size={20} className="text-slate-500"/>;
      }
  };

  const getBgColor = (type: UserNotification['type']) => {
      switch(type) {
          case 'Alert': return 'bg-red-50';
          case 'Info': return 'bg-blue-50';
          case 'System': return 'bg-orange-50';
          default: return 'bg-slate-50';
      }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn pb-20">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Bell className="text-orange-500"/> Notifications
                </h2>
                <p className="text-slate-500 mt-1">Stay updated on approvals, system alerts, and team activity.</p>
            </div>
            {notifications.length > 0 && (
                <button 
                    onClick={onClearAll}
                    className="text-sm text-slate-500 hover:text-red-600 flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <Trash2 size={16}/> Clear All
                </button>
            )}
        </div>

        {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                    <Bell size={32}/>
                </div>
                <h3 className="text-lg font-medium text-slate-600">All caught up!</h3>
                <p className="text-slate-400">You have no new notifications.</p>
            </div>
        ) : (
            <div className="space-y-4">
                <div className="flex justify-between items-center px-2 mb-2">
                    <span className="text-sm font-medium text-slate-500">
                        {unreadCount} Unread Notification{unreadCount !== 1 ? 's' : ''}
                    </span>
                </div>
                {notifications.map((notif) => (
                    <div 
                        key={notif.id} 
                        className={`relative bg-white rounded-xl shadow-sm border p-5 transition-all hover:shadow-md flex gap-4 ${notif.read ? 'border-slate-100 opacity-75' : 'border-orange-100 ring-1 ring-orange-50'}`}
                        onClick={() => !notif.read && onMarkAsRead(notif.id)}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getBgColor(notif.type)}`}>
                            {getIcon(notif.type)}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h4 className={`font-bold ${notif.read ? 'text-slate-700' : 'text-slate-900'}`}>
                                    {notif.title}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400 whitespace-nowrap">
                                        {new Date(notif.date).toLocaleString()}
                                    </span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteNotification(notif.id); }}
                                        className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <X size={16}/>
                                    </button>
                                </div>
                            </div>
                            <p className="text-slate-600 text-sm mt-1 leading-relaxed">{notif.message}</p>
                            
                            {!notif.read && (
                                <div className="mt-3 flex justify-end">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onMarkAsRead(notif.id); }}
                                        className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-3 py-1.5 rounded-full"
                                    >
                                        <CheckCircle size={12}/> Mark as Read
                                    </button>
                                </div>
                            )}
                        </div>
                        {!notif.read && (
                            <div className="absolute top-5 left-5 w-3 h-3 bg-orange-500 rounded-full border-2 border-white shadow-sm"></div>
                        )}
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default NotificationsView;
