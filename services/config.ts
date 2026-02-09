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

export const updateConfig = (newConfig: Partial<ServiceConfig>, forceReload = false) => {
    // 1. Update internal state immediately
    currentConfig = { ...currentConfig, ...newConfig };
    
    // 2. Persist to storage
    localStorage.setItem(CONFIG_KEY, JSON.stringify(currentConfig));
    
    // 3. Dispatch event for UI updates asynchronously to avoid blocking the click handler
    setTimeout(() => {
        window.dispatchEvent(new Event('config-change'));
        
        // Only reload if explicitly forced (avoiding this prevents 404s in some SPA environments)
        if (forceReload) {
            window.location.reload();
        }
    }, 50);
};

export const resetToDefaults = (forceReload = true) => {
    localStorage.removeItem(CONFIG_KEY);
    currentConfig = DEFAULT_CONFIG;
    window.dispatchEvent(new Event('config-change'));
    if(forceReload) window.location.reload();
};

export const forceTestMode = () => {
    updateConfig({
        useMockAuth: true,
        useMockDB: true,
        useMockRedshift: true
    }, false);
};

// Helper for the "Test Mode" visual indicator (Red Border)
// We consider it "Test Mode" if ANY service is being mocked.
export const isTestMode = () => {
    return currentConfig.useMockAuth || currentConfig.useMockDB || currentConfig.useMockRedshift;
};

export const AWS_API_CONFIG = {
    baseUrl: 'https://api.aws-region.amazonaws.com/prod',
    apiKey: 'your-aws-api-key'
};