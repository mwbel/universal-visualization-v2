import React from 'react';
import { notification } from 'antd';
import { useInteractiveStore } from '@store/interactiveStore';
import { useEffect } from 'react';

const NotificationCenter: React.FC = () => {
  const { notifications } = useInteractiveStore();

  // 显示通知
  useEffect(() => {
    notifications.forEach((notif) => {
      notification[notif.type]({
        message: notif.type === 'success' ? '成功' :
               notif.type === 'error' ? '错误' :
               notif.type === 'warning' ? '警告' : '信息',
        description: notif.message,
        duration: notif.duration || 4.5,
        key: notif.id
      });
    });
  }, [notifications]);

  return null; // 这个组件只负责显示通知，不需要渲染内容
};

export default NotificationCenter;