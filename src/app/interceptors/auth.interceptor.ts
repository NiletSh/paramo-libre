import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor que agrega automáticamente el token JWT
 * a todas las peticiones HTTP salientes.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('pl_token') || sessionStorage.getItem('pl_token');

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
