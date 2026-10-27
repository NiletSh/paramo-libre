import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        duration: 5500,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['snackbar-info']
      }
    },
    // Optimización de detección de cambios
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // Configuración de rutas con layouts
    provideRouter(routes),
    
    // Animaciones de Angular Material
    provideAnimationsAsync(),
    
    // Cliente HTTP con interceptor de JWT
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};