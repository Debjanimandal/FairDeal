/**
 * Server startup initialization
 * 
 * NOTE: Disabled for Vercel deployment due to serverless environment
 * Storage is initialized on-demand in API routes instead
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 FairDeal Next.js Backend starting...');
    console.log('ℹ️  Running in serverless mode - storage initialized per-request');
    console.log('✅ FairDeal Backend ready');
  }
}
