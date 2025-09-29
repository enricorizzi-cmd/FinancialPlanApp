import React from 'react';
import { useAppContext } from '../contexts/AppContext';

const NotificationContainer: React.FC = () => {
  const { notifications } = useAppContext();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`max-w-sm rounded-lg px-4 py-3 text-sm shadow-lg ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : notification.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;
