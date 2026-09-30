import { ApplicationConfig, inject } from '@angular/core';
import { provideRouter, Router, Routes } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor, ApiService } from './api.service';
import { LoginComponent } from './login.component';
import { VisualizerComponent } from './visualizer.component';
import { SavedComponent } from './saved.component';
import { AdminComponent } from './admin.component';

const user = () => inject(ApiService).name ? true : inject(Router).createUrlTree(['/login']);
const admin = () => inject(ApiService).role === 'Admin' ? true : inject(Router).createUrlTree(['/']);
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: VisualizerComponent, canActivate: [user] },
  { path: 'saved', component: SavedComponent, canActivate: [user] },
  { path: 'admin', component: AdminComponent, canActivate: [user, admin] },
  { path: '**', redirectTo: '' }];
export const appConfig: ApplicationConfig = { providers: [provideRouter(routes), provideHttpClient(withInterceptors([authInterceptor]))] };
