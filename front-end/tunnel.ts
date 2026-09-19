// Public copy: optional tunnel domain via environment, 2026-09-19.
import 'dotenv/config';
import ngrok from '@ngrok/ngrok';

(async function startTunnel(): Promise<void> {
    try {
        const listener = await ngrok.forward({
            addr: 5173,
            authtoken: process.env.NGROK_AUTH_TOKEN,
            ...(process.env.NGROK_DOMAIN ? { domain: process.env.NGROK_DOMAIN } : {})
        });

        console.log(`\n==========================================`);
        console.log(`🌊 OCEANSENSE LIVE TUNNEL ESTABLISHED 🌊`);
        console.log(`📱 Mobile Testing URL: ${listener.url()}`);
        console.log(`==========================================\n`);

        // Catch Ctrl+C and gracefully shut down the tunnel
        process.on('SIGINT', async () => {
            console.log('\n Disconnecting Ngrok tunnel...');
            try {
                await listener.close();
                console.log(' Tunnel closed safely.');
                process.exit(0);
            } catch {
                process.exit(1);
            }
        });

        // keep Node process awake
        process.stdin.resume();

    } catch (err) {
        console.error('Error starting ngrok:', err);
    }
})();