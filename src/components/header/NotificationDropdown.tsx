import React, { useState } from 'react';
import { Bell, CheckCheck, Trash2, ChevronRight, X, Sparkles, Target, Flame, Trophy, BookOpen } from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useStudyStore } from '../../store/useStudyStore';
import { NotificationItem } from '../../types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotificationStore();
  const { setActiveTab } = useStudyStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread') return !item.is_read;
    return true;
  });

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.action_tab) {
      setActiveTab(item.action_tab);
      onClose();
    }
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'goal':
        return <Target className="w-4 h-4 text-emerald-400" />;
      case 'streak':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'level':
        return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 'quote':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'reminder':
        return <BookOpen className="w-4 h-4 text-indigo-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div 
      className="absolute right-0 top-12 w-80 md:w-96 bg-slate-900/95 border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-950/60 backdrop-blur-xl z-50 overflow-hidden animate-scale-up"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Dropdown Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-purple-500/20 bg-indigo-950/40">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-4 h-4 text-purple-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <h3 className="text-xs font-bold font-outfit text-white tracking-wide uppercase">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[10px] text-purple-300 hover:text-white flex items-center gap-1 font-semibold transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Read all</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-purple-500/10 bg-slate-950/40 text-xs font-medium">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-xl transition-all ${
            filter === 'all'
              ? 'bg-purple-600 text-white font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1 rounded-xl transition-all ${
            filter === 'unread'
              ? 'bg-purple-600 text-white font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-purple-500/10">
        {filteredNotifications.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
            <p>No notifications right now</p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`p-4 flex items-start gap-3 transition-colors cursor-pointer group ${
                item.is_read ? 'bg-transparent hover:bg-slate-800/40' : 'bg-purple-950/20 hover:bg-purple-950/40'
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 shrink-0 mt-0.5">
                {getNotificationIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h4 className={`text-xs font-bold truncate ${item.is_read ? 'text-slate-300' : 'text-white'}`}>
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {item.message}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {!item.is_read && (
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotification(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all"
                  title="Clear notification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dropdown Footer */}
      <div className="p-3 border-t border-purple-500/20 bg-slate-950/60 text-center">
        <span className="text-[11px] text-slate-400">
          Stay focused &amp; conquer your study goals 🚀
        </span>
      </div>
    </div>
  );
};
