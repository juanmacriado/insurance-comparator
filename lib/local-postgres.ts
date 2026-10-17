import { neonConfig } from '@neondatabase/serverless';

/**
 * Soporte de base de datos local (docker-compose.yml).
 *
 * @vercel/postgres usa el driver serverless de Neon (HTTP y WebSocket), que no habla con
 * un Postgres normal. Cuando POSTGRES_URL apunta a localhost, se redirigen ambas vías al
 * proxy local de docker-compose.yml (puerto 4444), que habla con el Postgres del contenedor.
 * En Vercel (POSTGRES_URL de Neon) esta función no hace nada.
 */

export function isLocalPostgres(url = process.env.POSTGRES_URL): boolean {
    if (!url) return false;
    try {
        const { hostname } = new URL(url.replace(/^postgres(ql)?:\/\//, 'http://'));
        return hostname === 'localhost' || hostname === '127.0.0.1';
    } catch {
        return false;
    }
}

let configured = false;

export function configureLocalPostgres() {
    if (configured) return;
    configured = true;

    if (!isLocalPostgres()) {
        if (process.env.NODE_ENV === 'development' && process.env.POSTGRES_URL) {
            console.warn(
                '\n⚠️  [DB] Estás en desarrollo pero POSTGRES_URL NO es local: los cambios afectarán a la base de datos REAL.\n' +
                '    Para usar la base local, crea .env.development.local (ver DOCUMENTACION.md §3).\n',
            );
        }
        return;
    }

    // @vercel/postgres usa dos vías: sql`...` va por HTTP y sql.query() por WebSocket.
    // El proxy local (local-neon-http-proxy) atiende ambas en el mismo puerto.
    const port = process.env.LOCAL_NEON_PROXY_PORT || '4444';
    neonConfig.fetchEndpoint = (host: string) => `http://${host}:${port}/sql`;
    neonConfig.wsProxy = (host: string) => `${host}:${port}/v2`;
    neonConfig.useSecureWebSocket = false;
    neonConfig.pipelineTLS = false;
    neonConfig.pipelineConnect = false;
    console.log(`[DB] Base de datos LOCAL (proxy de Neon en el puerto ${port}).`);
}
