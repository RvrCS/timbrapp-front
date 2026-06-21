import { Injectable, inject, computed, Signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Cliente, ClienteForm } from '../models/cliente.models';
import { CachedResource } from '../utils/cached-resource';

/**
 * CRUD sobre /api/clientes.
 * La lista se cachea en memoria (TTL 10 min); se actualiza optimistamente en
 * cada mutación sin refetch adicional.
 */
@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly api = inject(ApiService);

  private readonly _cache = new CachedResource<Cliente[]>(10 * 60 * 1000);

  /** Signal reactivo con la lista de clientes — usa en templates y computed. */
  readonly clientes: Signal<Cliente[]> = computed(() => this._cache.value() ?? []);

  /** Carga la lista; retorna caché si está fresco. `force = true` ignora TTL. */
  list(force = false): Observable<Cliente[]> {
    return this._cache.load(() => this.api.get<Cliente[]>('/api/clientes'), force);
  }

  get(id: string): Observable<Cliente> {
    return this.api.get<Cliente>(`/api/clientes/${id}`);
  }

  create(form: ClienteForm): Observable<Cliente> {
    return this.api.post<Cliente>('/api/clientes', form).pipe(
      tap((c) => this._cache.update((list) => [...(list ?? []), c]))
    );
  }

  update(id: string, form: ClienteForm): Observable<Cliente> {
    return this.api.put<Cliente>(`/api/clientes/${id}`, form).pipe(
      tap((updated) =>
        this._cache.update((list) =>
          (list ?? []).map((c) => (c.id === id ? updated : c))
        )
      )
    );
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/clientes/${id}`).pipe(
      tap(() => this._cache.update((list) => (list ?? []).filter((c) => c.id !== id)))
    );
  }
}
