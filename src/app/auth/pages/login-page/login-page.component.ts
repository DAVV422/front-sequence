import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { catchError, of, tap } from 'rxjs';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'auth-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'],
})
export class LoginPageComponent {

  public disabled: boolean = false;

  public loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private snackbar: MatSnackBar,
  ) { }

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.disabled = true;
    const { email, password } = this.loginForm.value;
    this.authService.login(email, password)
      .pipe(
        tap(resp => localStorage.setItem('token', resp.accessToken)),
        tap(resp => localStorage.setItem('user', JSON.stringify(resp.User))),
        catchError(err => of(
          this.showSnackbar('Usuario o Contraseña Incorrecta', 'Cerrar')
        )),
        tap(() => this.disabled = false),
      ).subscribe(resp => {
        if (resp) {
          this.router.navigate(['/diagram']);
          this.showSnackbar('Sesión iniciada correctamente', 'Cerrar');
        }
      });
  }

  isValidField(field: string): boolean | null {
    return this.loginForm.controls[field].errors && this.loginForm.controls[field].touched;
  }

  getFieldError(field: string): string | null {
    if (!this.loginForm.controls[field]) return null;
    const errors = this.loginForm.controls[field].errors || {};
    for (const key of Object.keys(errors)) {
      switch (key) {
        case 'required':
          return 'El campo es obligatorio';
        case 'minlength':
          return `El campo debe tener al menos ${errors['minlength'].requiredLength} caracteres`;
        case 'pattern':
          return 'El campo no tiene el formato correcto';
      }
    }
    return null;
  }

  showSnackbar(message: string, action?: string) {
    this.snackbar.open(message, action, {
      duration: 2500,
    });
  }
}
