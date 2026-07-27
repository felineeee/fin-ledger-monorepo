export declare enum Environment {
    Development = "development",
    Production = "production",
    Test = "test"
}
export declare class EnvironmentVariables {
    APP_ENV: Environment;
    HTTP_PORT: number;
    DATABASE_URL: string;
    REDIS_URL: string;
    JWT_SECRET: string;
}
export declare function validateEnv(config: Record<string, unknown>): EnvironmentVariables;
