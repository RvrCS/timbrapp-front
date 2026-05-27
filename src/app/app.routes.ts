import { Routes } from '@angular/router';

export const routes: Routes = [
  // Redirige raíz a login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Login — sin shell
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(m => m.LoginComponent),
  },

  // Área autenticada — shell con sidebar como layout padre
  {
    path: '',
    loadComponent: () =>
      import('./components/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'subir',
        loadComponent: () =>
          import('./components/subir/subir.component').then(m => m.SubirComponent),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./components/clientes/clientes.component').then(m => m.ClientesComponent),
      },
      {
        path: 'certificados',
        loadComponent: () =>
          import('./components/certificados/certificados.component').then(m => m.CertificadosComponent),
      },
      {
        path: 'timbrados',
        loadComponent: () =>
          import('./components/timbrados/timbrados.component').then(m => m.TimbradosComponent),
      },
      { path: '', redirectTo: 'subir', pathMatch: 'full' },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
