import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="admin-shell">
      <h1>Panel de administración</h1>
      <p>Gestiona usuarios, libros y solicitudes desde aquí.</p>
      <div class="cards">
        <div class="card">
          <h3>Usuarios</h3>
          <p>Revisa cuentas activas e inactivas.</p>
        </div>
        <div class="card">
          <h3>Libros</h3>
          <p>Modera publicaciones y contenidos.</p>
        </div>
        <div class="card">
          <h3>Intercambios</h3>
          <p>Supervisa solicitudes y estados.</p>
        </div>
      </div>
    </section>
  `,
  styles: [
    `.admin-shell{padding:2rem;max-width:1100px;margin:0 auto;}`,
    `.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1.5rem;}`,
    `.card{background:#fff;border-radius:16px;padding:1.25rem;box-shadow:0 8px 24px rgba(0,0,0,.08);}`
  ]
})
export class AdminComponent {}
