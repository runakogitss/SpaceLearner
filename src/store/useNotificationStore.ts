import { create } from 'zustand';
import { NotificationItem, ToastItem } from '../types';

interface NotificationPreferences {
  toastsEnabled: boolean;
  dndDuringTimer: boolean;
}

interface NotificationState {
  notifications: NotificationItem[];
  toasts: ToastItem[];
  preferences: NotificationPreferences;
  unreadCount: number;
  
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'is_read'>) => void;
  
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  togglePreference: (key: keyof NotificationPreferences) => void;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Daily Goal Update 🎯',
    message: "You're at 0/120 mins focus time today. Start a 25m Pomodoro to build momentum!",
    type: 'goal',
    category: 'reminder',
    timestamp: '10m ago',
    is_read: false,
    action_tab: 'timer',
    action_label: 'Start 25m Timer'
  },
  {
    id: 'notif-2',
    title: 'Daily Focus Boost Ready 🚀',
    message: 'Today\'s quote: "Discipline is the bridge between goals and accomplishment." — Jim Rohn',
    type: 'quote',
    category: 'boost',
    timestamp: '1h ago',
    is_read: false,
    action_tab: 'dashboard',
    action_label: 'View Quote'
  },
  {
    id: 'notif-3',
    title: 'Study Streak Milestone 🔥',
    message: 'Maintain your momentum to reach a 7-day streak achievement badge!',
    type: 'streak',
    category: 'achievement',
    timestamp: '3h ago',
    is_read: false,
    action_tab: 'statistics',
    action_label: 'View Stats'
  },
  {
    id: 'notif-4',
    title: 'Planner Note Reflection 📝',
    message: 'Don\'t forget to complete your post-study reflection for Spanish!',
    type: 'reminder',
    category: 'reminder',
    timestamp: 'Yesterday',
    is_read: true,
    action_tab: 'planner',
    action_label: 'Write Reflection'
  }
];

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: INITIAL_NOTIFICATIONS,
  toasts: [],
  preferences: {
    toastsEnabled: true,
    dndDuringTimer: true
  },
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
    const state = get();
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      is_read: false
    };
    const updated = [newNotif, ...state.notifications];
    
    set({
      notifications: updated,
      unreadCount: updated.filter(n => !n.is_read).length
    });

    if (state.preferences.toastsEnabled) {
      state.addToast({
        title: item.title,
        message: item.message,
        type: item.category === 'achievement' ? 'success' : 'info'
      });
    }
  },

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }));

    setTimeout(() => {
      get().removeToast(id);
    }, 4500);
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  },

  togglePreference: (key) => {
    set((state) => ({
      preferences: {
        ...state.preferences,
        [key]: !state.preferences[key]
      }
    }));
  }
}));
