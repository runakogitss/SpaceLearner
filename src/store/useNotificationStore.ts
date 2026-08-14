import { create } from 'zustand';
import { NotificationItem } from '../types';

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'is_read'>) => void;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Daily Goal Update 🎯',
    message: "You're at 0/120 mins focus time today. Start a 25m Pomodoro to build momentum!",
    type: 'goal',
    timestamp: '10m ago',
    is_read: false,
    action_tab: 'timer'
  },
  {
    id: 'notif-[2]',
    title: 'Daily Focus Boost Ready 🚀',
    message: 'Today\'s quote: "Discipline is the bridge between goals and accomplishment." — Jim Rohn',
    type: 'quote',
    timestamp: '1h ago',
    is_read: false,
    action_tab: 'dashboard'
  },
  {
    id: 'notif-3',
    title: 'Study Streak Reminder 🔥',
    message: 'Complete at least one session today to maintain your study streak!',
    type: 'streak',
    timestamp: '3h ago',
    is_read: false,
    action_tab: 'timer'
  },
  {
    id: 'notif-4',
    title: 'Planner Note Reflection 📝',
    message: 'Don\'t forget to complete your post-study reflection for Spanish!',
    type: 'reminder',
    timestamp: 'Yesterday',
    is_read: true,
    action_tab: 'planner'
  }
];

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: INITIAL_NOTIFICATIONS,
  unreadCount: INITIAL_NOTIFICATIONS.filter(n => !n.is_read).length,

  markAsRead: (id: string) => {
    set((state) => {
      const updated = state.notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter(n => !n.is_read).length
      };
    });
  },

  markAllAsRead: () => {
    set((state) => {
      const updated = state.notifications.map(n => ({ ...n, is_read: true }));
      return {
        notifications: updated,
        unreadCount: 0
      };
    });
  },

  clearNotification: (id: string) => {
    set((state) => {
      const updated = state.notifications.filter(n => n.id !== id);
      return {
        notifications: updated,
        unreadCount: updated.filter(n => !n.is_read).length
      };
    });
  },

  addNotification: (item) => {
    set((state) => {
      const newNotif: NotificationItem = {
        ...item,
        id: `notif-${Date.now()}`,
        timestamp: 'Just now',
        is_read: false
      };
      const updated = [newNotif, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: updated.filter(n => !n.is_read).length
      };
    });
  }
}));
