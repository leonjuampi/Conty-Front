export const ROLE_IDS = {
  ADMIN: 1,
  OWNER: 2,
  VENDEDOR: 3,
} as const;

export type RoleId = (typeof ROLE_IDS)[keyof typeof ROLE_IDS];

export function getRoleName(roleId: number): string {
  switch (roleId) {
    case ROLE_IDS.ADMIN: return 'Admin';
    case ROLE_IDS.OWNER: return 'Propietario';
    case ROLE_IDS.VENDEDOR: return 'Vendedor';
    default: return 'Usuario';
  }
}

/** Los vendedores deben tener caja abierta para operar */
export function needsCashOpen(roleId: number): boolean {
  return roleId === ROLE_IDS.VENDEDOR;
}

/** Solo admin y owner pueden acceder a configuraciones avanzadas */
export function canManage(roleId: number): boolean {
  return roleId === ROLE_IDS.ADMIN || roleId === ROLE_IDS.OWNER;
}
