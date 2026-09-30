import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from './api.service';

@Component({ selector: 'app-login', standalone: true, imports: [FormsModule],
  template: `<div style="max-width:340px;margin:40px auto;display:grid;gap:8px">
    <h2>{{reg ? 'Register' : 'Login'}}</h2>
    @if (reg) { <input [(ngModel)]="name" placeholder="Name"> }
    <input [(ngModel)]="email" placeholder="Email"><input [(ngModel)]="password" type="password" placeholder="Password (6+ chars)">
    <button (click)="go()">{{reg ? 'Create account' : 'Login'}}</button>
    <a href="javascript:void(0)" (click)="reg = !reg">{{reg ? 'Have an account? Login' : 'New user? Register'}}</a>
    <span style="color:#b42318">{{err}}</span></div>` })
export class LoginComponent {
  private api = inject(ApiService); private r = inject(Router);
  reg = false; name = ''; email = ''; password = ''; err = '';
  go() {
    this.api.post(this.reg ? '/auth/register' : '/auth/login', { name: this.name, email: this.email, password: this.password })
      .subscribe({ next: x => { this.api.setSession(x); this.r.navigate(['/']); }, error: e => this.err = e.error?.error || 'Server error' });
  }
}
