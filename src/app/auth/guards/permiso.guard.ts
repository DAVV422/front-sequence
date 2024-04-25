import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermisoGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  private checkPermiso(permisos: string[]): Observable<boolean> | boolean {
    return this.authService.checkPermission(permisos)
      .pipe(
        map(hasPermiso => {
          if (!hasPermiso) this.router.navigate(['not-authorized']);
          return hasPermiso;
        })
      )
  }

  // canMatch(route: Route, segments: UrlSegment[]): boolean | Observable<boolean> {
  //   const params: PermisoGuardParams = route.data.params;
  //   return this.checkPermiso(params.permisos);
  // }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const params: string[] = route.data?.['params'];
    return this.checkPermiso(params);
  }

}
