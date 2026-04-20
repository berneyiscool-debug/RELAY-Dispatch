// ============================================
// SIMPRO CLONE — CLIENT-SIDE ROUTER
// ============================================

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.onNavigate = null;
    window.addEventListener('hashchange', () => this.resolve());
  }

  register(path, handler) {
    this.routes[path] = handler;
  }

  navigate(path) {
    window.location.hash = path;
  }

  resolve() {
    let hash = window.location.hash.slice(1) || '/';
    const queryIndex = hash.indexOf('?');
    const queryParams = {};
    if (queryIndex !== -1) {
      const qs = hash.substring(queryIndex + 1);
      hash = hash.substring(0, queryIndex);
      qs.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        if (k) queryParams[k] = decodeURIComponent(v || '');
      });
    }

    const { handler, params } = this.matchRoute(hash);

    if (handler) {
      this.currentRoute = hash;
      const allParams = { ...params, ...queryParams };
      if (this.onNavigate) this.onNavigate(hash, allParams);
      handler(allParams);
    }
  }

  matchRoute(path) {
    // Exact match first
    if (this.routes[path]) {
      return { handler: this.routes[path], params: {} };
    }

    // Pattern match (e.g., /people/:id)
    for (const [route, handler] of Object.entries(this.routes)) {
      const routeParts = route.split('/');
      const pathParts = path.split('/');

      if (routeParts.length !== pathParts.length) continue;

      const params = {};
      let match = true;

      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) {
          params[routeParts[i].slice(1)] = pathParts[i];
        } else if (routeParts[i] !== pathParts[i]) {
          match = false;
          break;
        }
      }

      if (match) return { handler, params };
    }

    return { handler: null, params: {} };
  }

  getCurrentPath() {
    return window.location.hash.slice(1) || '/';
  }

  getBasePath() {
    const path = this.getCurrentPath();
    const parts = path.split('/').filter(Boolean);
    return '/' + (parts[0] || '');
  }
}

export const router = new Router();
