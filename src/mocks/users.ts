
export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'vendedor' | 'cajero';
  avatar: string;
}

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    name: 'Administrador',
    role: 'admin',
    avatar: 'A'
  },
  {
    id: '2',
    username: 'vendedor1',
    password: 'vend123',
    name: 'Carlos López',
    role: 'vendedor',
    avatar: 'C'
  },
  {
    id: '3',
    username: 'cajero1',
    password: 'caja123',
    name: 'María García',
    role: 'cajero',
    avatar: 'M'
  }
];
