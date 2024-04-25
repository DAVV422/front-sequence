import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { Observable, catchError, map, of } from 'rxjs';
import { Login } from '../interfaces/response/login.interface';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl: string = environment.baseUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  login(email: string, password: string): Observable<Login> {
    return this.http.post<Login>(`${this.baseUrl}/login`, { email, password });
  }

  checkToken(): Observable<boolean> {
    if (!localStorage.getItem('token')) return of(false);
    const token = localStorage.getItem('token');
    return this.http.post<boolean>(`${this.baseUrl}/checkToken`, { token }).
      pipe(
        map(user => !!user),
        map(isAuth => {
          if (!isAuth) this.logout();
          return isAuth;
        }),
        catchError(err => of(false))
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/auth/login']);
  }

  getToten(): string {
    return localStorage.getItem('token') || '';
  }

  headers() {
    return {
      headers: { Authorization: `Bearer ${this.getToten()}` }
    }
  }

  checkPermission(permisos: string[]): Observable<boolean> {
    let userLS = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userLS) return of(false);
    return of(true);
  }


  checkPermissionLocal(permisos: string[]): boolean {
    let userLS = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userLS) return false;
    return true;
  }

}

