import { Injectable } from '@angular/core';
import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const API = 'http://localhost:5000/api'; // change to your deployed backend URL

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const t = localStorage.getItem('token');
  return next(t ? req.clone({ setHeaders: { Authorization: 'Bearer ' + t } }) : req);
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  get name() { return localStorage.getItem('name'); }
  get role() { return localStorage.getItem('role'); }
  get(p: string) { return this.http.get<any>(API + p); }
  post(p: string, b: any) { return this.http.post<any>(API + p, b); }
  del(p: string) { return this.http.delete<any>(API + p); }
  setSession(r: any) { localStorage.setItem('token', r.token); localStorage.setItem('name', r.name); localStorage.setItem('role', r.role); }
  logout() { localStorage.clear(); }
}
