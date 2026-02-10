
// Granular Service Configuration
// Persisted in LocalStorage so settings survive refreshes

export interface ServiceConfig {
    useMockAuth: boolean;      // If true, bypass Firebase
    useMockDB: boolean;        // If true, use LocalStorage instead of AWS RDS
    useMockRedshift: boolean;  // If true, mock the ETL trigger
}

const CONFIG_KEY = 'gdip_service_config_v1';

// Default is Test Mode (True) for the initial offering demo
const DEFAULT_CONFIG: ServiceConfig = {
    useMockAuth: true,
    useMockDB: true,
    useMockRedshift: true
};

// Load config or default
const loadConfig = (): ServiceConfig => {
    try {
        const stored = localStorage.getItem(CONFIG_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
    } catch {
        return DEFAULT_CONFIG;
    }
};

let currentConfig = loadConfig();

export const getConfig = (): ServiceConfig => {
    return currentConfig;
};

export const updateConfig = (newConfig: Partial<ServiceConfig>) => {
    // 1. Update internal state immediately
    currentConfig = { ...currentConfig, ...newConfig };
    
    // 2. Persist to storage
    localStorage.setItem(CONFIG_KEY, JSON.stringify(currentConfig));
    
    // 3. Dispatch event for UI updates asynchronously
    // We removed window.location.reload() to avoid security errors in blob-origin environments.
    setTimeout(() => {
        window.dispatchEvent(new Event('config-change'));
    }, 50);
};

export const resetToDefaults = () => {
    localStorage.removeItem(CONFIG_KEY);
    currentConfig = DEFAULT_CONFIG;
    window.dispatchEvent(new Event('config-change'));
};

export const forceTestMode = () => {
    updateConfig({
        useMockAuth: true,
        useMockDB: true,
        useMockRedshift: true
    });
};

// Helper for the "Test Mode" visual indicator (Red Border)
export const isTestMode = () => {
    return currentConfig.useMockAuth || currentConfig.useMockDB || currentConfig.useMockRedshift;
};

export const AWS_API_CONFIG = {
    baseUrl: 'https://api.aws-region.amazonaws.com/prod',
    apiKey: 'your-aws-api-key'
};
