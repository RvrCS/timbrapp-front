import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Cliente, ClienteForm } from '../models/cliente.models';

/**
 * CRUD sobre /api/clientes.
 * Mantiene un signal `clientes` como caché reactivo (usado en upload selector).
 * Auth headers añadidos automáticamente por AuthInterceptor.
 */
@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly api = inject(ApiService);

  /** Caché reactivo — se consume con clientes() en los componentes */
  readonly clientes = signal<Cliente[]>([]);

  list(): Observable<Cliente[]> {
    return this.api.get<Cliente[]>('/api/clientes').pipe(
      tap((list) => this.clientes.set(list))
    );
  }

  get(id: string): Observable<Cliente> {
    return this.api.get<Cliente>(`/api/clientes/${id}`);
  }

  create(form: ClienteForm): Observable<Cliente> {
    return this.api.post<Cliente>('/api/clientes', form).pipe(
      tap((c) => this.clientes.update((list) => [...list, c]))
    );
  }

  update(id: string, form: ClienteForm): Observable<Cliente> {
    return this.api.put<Cliente>(`/api/clientes/${id}`, form).pipe(
      tap((updated) =>
        this.clientes.update((list) =>
          list.map((c) => (c.id === id ? updated : c))
        )
      )
    );
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/clientes/${id}`).pipe(
      tap(() => this.clientes.update((list) => list.filter((c) => c.id !== id)))
    );
  }
}
