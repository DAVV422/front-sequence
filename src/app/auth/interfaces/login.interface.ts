import { Usuario } from "src/app/administrativo/interfaces/response/usuario.interface";

export interface Login {
  accessToken: string;
  User: Usuario;
}
