import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  LucideAngularModule,
  Upload,
  Users,
  ShieldCheck,
  ReceiptText,
  ChevronsLeft,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Settings,
  UserRound,
} from 'lucide-angular';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(
      LucideAngularModule.pick({
        Upload,
        Users,
        ShieldCheck,
        ReceiptText,
        ChevronsLeft,
        Menu,
        X,
        LogOut,
        ChevronDown,
        Settings,
        UserRound,
      })
    ),
  ],
};
