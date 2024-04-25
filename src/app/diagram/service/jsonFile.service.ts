import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JsonFileService {
  constructor(private http: HttpClient) {}

  // Guarda el estado del diagrama en un archivo JSON
  saveToFile(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    // Crea un enlace temporal y simula un clic para descargar el archivo
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Limpia el enlace temporal
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Carga un archivo JSON y devuelve los datos como un observable
  loadFromFile(filename: string): Observable<any> {
    return this.http.get<any>(filename);
  }
}
