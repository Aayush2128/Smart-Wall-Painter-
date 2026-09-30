import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ApiService } from './api.service';

@Component({ selector: 'app-root', standalone: true, imports: [RouterOutlet, RouterLink],
  template: `<header style="display:flex;gap:14px;align-items:center;padding:10px 16px;background:#4f46e5;color:#fff;flex-wrap:wrap">
    <b>🎨 Smart Wall Paint Visualizer</b>
    @if (api.name) { <a routerLink="/" style="color:#fff">Visualizer</a><a routerLink="/saved" style="color:#fff">Saved designs</a>
      @if (api.role === 'Admin') { <a routerLink="/admin" style="color:#fff">Admin</a> }
      <span style="margin-left:auto">{{api.name}} ({{api.role}}) <button (click)="out()">Log out</button></span> }
  </header><main style="max-width:1000px;margin:auto;padding:14px;font-family:system-ui"><router-outlet/></main>` })
export class AppComponent {
  api = inject(ApiService); private r = inject(Router);
  out() { this.api.logout(); this.r.navigate(['/login']); }
}
