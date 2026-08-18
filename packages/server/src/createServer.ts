import { Express } from 'express';
import http from 'http';

/**
 * Plain HTTP on purpose - the certificate belongs to the reverse proxy in front
 * of this process (docker/prod/Caddyfile), not here.
 *
 * `https.createServer` reads the key and certificate once, at startup. Let's
 * Encrypt renews every ~60 days, so terminating TLS in Node means either
 * restarting the process on every renewal or reloading the context by hand
 * through `setSecureContext`. The proxy does this in place, unnoticed.
 *
 * `app.set('trust proxy', 1)` in app.ts is the other half of the arrangement:
 * it is what makes req.ip the real client address behind that one hop.
 */
const createServer = (app: Express) => {
    return http.createServer(app);
};

export { createServer };
