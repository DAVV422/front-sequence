export interface Rol {
  id: string;
  createdAt: string;
  updatedAt: string;
  nombre: string;
}

export interface Usuario{
  id: string;
  createdAt: string;
  updatedAt: string;
  nombre: string;
  apellido: string;
  email: string;
  role: Rol;
}

export interface Login {
  accessToken: string;
  User: Usuario;
}
