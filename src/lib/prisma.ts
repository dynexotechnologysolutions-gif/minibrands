import { PrismaClient } from '@prisma/client';
import { getEnvVar } from './env';

/**
 * PrismaClient singleton with connection pooling configuration
 * Configured for production workloads with connection limits and timeouts
 */

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Configure logging based on environment
    log:
      getEnvVar('NODE_ENV') === 'development'
        ? [
            'query',
            'error',
            'warn',
            // Avoid logging SQL queries in production for security/performance
          ]
        : ['error', 'warn'],

    // Connection pool configuration
    __internal: {
      env: {
        // Connection pool sizing
        CONNECTION_POOL_SIZE: getEnvVar('DB_POOL_MAX').toString(),
        // Query timeout
        QUERY_TIMEOUT: getEnvVar('DB_STATEMENT_TIMEOUT').toString(),
      },
    },
  });

// Prevent instantiating multiple instances in development
if (getEnvVar('NODE_ENV') !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Gracefully disconnect Prisma client
 * Used during application shutdown
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Health check for database connectivity
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Simple query to verify connection
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Get database connection pool status
 */
export async function getDatabaseStatus(): Promise<{
  healthy: boolean;
  error?: string;
}> {
  try {
    const result = await prisma.$queryRaw<{ timestamp: Date }[]>`
      SELECT NOW() as timestamp
    `;

    return {
      healthy: result.length > 0,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
