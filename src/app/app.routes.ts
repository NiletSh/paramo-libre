import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { BookFormComponent } from './pages/books/book-form/book-form';
import { ExchangeProposalComponent } from './pages/exchange-proposal/exchange-proposal.component';
import { MyProposalsComponent } from './pages/my-proposals/my-proposals.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { AdminComponent } from './pages/admin/admin.component';

export const routes: Routes = [
  // ============================================
  // RUTAS PÚBLICAS Y PRIVADAS CON MAIN LAYOUT
  // ============================================
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent)
      },
      {
        path: 'catalogo',
        loadComponent: () => import('./pages/catalog/catalog.component').then(m => m.CatalogComponent)
      },
      {
        path: 'libro/:id',
        loadComponent: () => import('./pages/book-detail/book-detail.component').then(m => m.BookDetailComponent)
      },
      {
        path: 'publicar-libro',
        component: BookFormComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'publicar',
        component: BookFormComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'libros/nuevo',
        redirectTo: 'publicar-libro',
        pathMatch: 'full'
      },
      {
        path: 'libros/:id/editar',
        component: BookFormComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'libro/:id/editar',
        component: BookFormComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'mis-libros',
        redirectTo: 'catalogo',
        pathMatch: 'full'
      },
      {
        path: 'intercambios',
        redirectTo: 'mis-propuestas',
        pathMatch: 'full'
      },
      {
        path: 'intercambio/:bookId',
        component: ExchangeProposalComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'mis-propuestas',
        component: MyProposalsComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'propuestas',
        component: MyProposalsComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'perfil',
        component: PerfilComponent,
        canActivate: [AuthGuard],
        title: 'Mi perfil - Páramo Libre'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'mi-espacio',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'admin',
        component: AdminComponent,
        canActivate: [AuthGuard, AdminGuard]
      }
    ]
  },

  // ============================================
  // RUTAS DE AUTENTICACIÓN CON AUTH LAYOUT
  // ============================================
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'registro',
        loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
      }
    ]
  },

  // ============================================
  // RUTA 404 - REDIRECCIÓN AL HOME
  // ============================================
  {
    path: '**',
    redirectTo: ''
  }
];
