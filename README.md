# ECHO HEIST - Mobile PWA

Mobile-optimized Progressive Web App build of ECHO HEIST.

## Local Testing

```bash
cd echo_heist_mobile
python3 -m http.server 8080
```

Open `http://localhost:8080` on your phone (same network) or use Chrome DevTools device emulation.

## Deployment

Upload the entire `echo_heist_mobile/` directory to any HTTPS-enabled static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, etc.). The service worker requires HTTPS to function.

## Native App Wrapping

### Android (Play Store)

- **TWA (Trusted Web Activity):** Use Bubblewrap or PWABuilder to generate a TWA wrapper that loads the hosted PWA in a fullscreen Chrome custom tab. No code changes needed.
- **Capacitor:** Run `npx cap init`, copy web assets to `www/`, then `npx cap add android && npx cap open android`.

### iOS (App Store)

- **Capacitor:** Same as above but with `npx cap add ios && npx cap open ios`. Builds a WKWebView wrapper.
- **Manual WKWebView:** Create a minimal Xcode project with a single WKWebView pointing to the bundled index.html.

## PWA Install

On Android Chrome, users can tap "Add to Home Screen" from the browser menu. The manifest and service worker enable the install prompt automatically after engagement criteria are met.
