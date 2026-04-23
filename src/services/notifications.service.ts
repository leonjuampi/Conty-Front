import { api } from './api';

export interface Notification {
  id: number;
  title: string;
  body: string;
  created_at: string;
  is_read: boolean;
}

export async function getNotifications(): Promise<Notification[]> {
  const { data } = await api.get('/notifications');
  return data.map((n: Notification & { is_read: number }) => ({ ...n, is_read: !!n.is_read }));
}

export async function markAsRead(id: number): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await api.post('/notifications/read-all');
}

export async function uploadNotificationImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post('/superadmin/notifications/upload-image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}

// Superadmin
export async function getSuperadminNotifications(): Promise<(Notification & { is_active: boolean })[]> {
  const { data } = await api.get('/superadmin/notifications');
  return data;
}

export async function createNotification(title: string, body: string): Promise<Notification> {
  const { data } = await api.post('/superadmin/notifications', { title, body });
  return data;
}

export async function deleteNotification(id: number): Promise<void> {
  await api.delete(`/superadmin/notifications/${id}`);
}
