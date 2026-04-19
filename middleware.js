// Vercel Edge Middleware — Language detection & rewriting for static site
// Priority: cookie fp-site-lang > Accept-Language header > default (fr)

export const config = {
  matcher: ['/', '/((?!api|_vercel|en/|.*\\.(?:css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|mp4|webm)).*)'],
};

export default function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Determine language preference
  let lang = 'fr';

  // 1. Check cookie (highest priority)
  const cookieHeader = request.headers.get('cookie') || '';
  const langCookie = cookieHeader.split(';').find(c => c.trim().startsWith('fp-site-lang='));
  if (langCookie) {
    const val = langCookie.split('=')[1]?.trim();
    if (val === 'en' || val === 'fr') lang = val;
  }

  // 2. If no cookie, check Accept-Language
  if (!langCookie) {
    const acceptLang = request.headers.get('accept-language') || '';
    const primary = acceptLang.split(',')[0]?.trim().toLowerCase() || '';
    if (!primary.startsWith('fr')) {
      lang = 'en';
    }
  }

  // FR = default, no rewrite needed
  if (lang === 'fr') return;

  // Rewrite to /en/ version
  const rewriteUrl = new URL(request.url);
  if (path === '/') {
    rewriteUrl.pathname = '/en/index.html';
  } else if (path.endsWith('.html')) {
    rewriteUrl.pathname = '/en' + path;
  } else if (!path.includes('.')) {
    rewriteUrl.pathname = '/en' + path + (path.endsWith('/') ? 'index.html' : '.html');
  } else {
    return; // Don't rewrite unknown file types
  }

  // Use fetch-based rewrite (Vercel Edge compatible for static sites)
  return fetch(rewriteUrl);
}
