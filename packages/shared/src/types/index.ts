export const Role = {
  ADMIN: "ADMIN",
  TECNICO: "TECNICO",
  COMMERCIALE: "COMMERCIALE",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const TipoCliente = {
  PRIVATO: "PRIVATO",
  AZIENDA: "AZIENDA",
} as const;
export type TipoCliente = (typeof TipoCliente)[keyof typeof TipoCliente];

export const CategoriaFornitore = {
  RICAMBI: "RICAMBI",
  SERVIZI: "SERVIZI",
  ALTRO: "ALTRO",
} as const;
export type CategoriaFornitore =
  (typeof CategoriaFornitore)[keyof typeof CategoriaFornitore];

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Pick<User, "id" | "username" | "email" | "role">;
}

export type RefreshResponse = LoginResponse;

export interface UpdateUserRoleRequest {
  role: Role;
}

export interface ManagedUserResponse {
  id: number;
  username: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export type UpdateUserRoleResponse = ManagedUserResponse;
export type DeactivateUserResponse = ManagedUserResponse;

export interface ChangeOwnPasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeOwnPasswordResponse {
  success: true;
}

export interface Cliente {
  id: number;
  codiceCliente: string;
  tipologia: TipoCliente;
  nome: string;
  cognome: string | null;
  ragioneSociale: string | null;
  partitaIva: string | null;
  codiceFiscale: string | null;
  indirizzo: string;
  citta: string;
  cap: string;
  provincia: string;
  telefono: string | null;
  email: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Fornitore {
  id: number;
  codiceFornitore: string;
  categoria: CategoriaFornitore;
  nome: string;
  cognome: string | null;
  ragioneSociale: string | null;
  partitaIva: string | null;
  codiceFiscale: string | null;
  indirizzo: string;
  citta: string;
  cap: string;
  provincia: string;
  telefono: string | null;
  email: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: number;
  userId: number | null;
  action: string;
  modelName: string;
  objectId: string;
  timestamp: string;
}
