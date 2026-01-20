// Granular Service Configuration
// Persisted in LocalStorage so settings survive refreshes

export interface ServiceConfig {
    useMockAuth: boolean;      // If true, bypass Firebase
    useMockDB: boolean;        // If true, use LocalStorage instead of AWS RDS
    useMockRedshift: boolean;  // If true, mock the ETL trigger
}

const CONFIG_KEY = 'gdip_service_config_v1';

// CHANGED: Default is now Production (False) as requested
const DEFAULT_CONFIG: ServiceConfig = {
    useMockAuth: false,
    useMockDB: false,
    useMockRedshift: false
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
    currentConfig = { ...currentConfig, ...newConfig };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(currentConfig));
    
    // Dispatch event for UI updates
    window.dispatchEvent(new Event('config-change'));
    
    // Force reload to ensure services re-bind correctly (especially Auth)
    if (forceReload) {
        window.location.reload();
    } else if (confirm("Configuration changed. Reload page to apply changes?")) {
        window.location.reload();
    }
};

export const resetToDefaults = (forceReload = true) => {
    localStorage.removeItem(CONFIG_KEY);
    currentConfig = DEFAULT_CONFIG;
    if(forceReload) window.location.reload();
};

export const forceTestMode = () => {
    updateConfig({
        useMockAuth: true,
        useMockDB: true,
        useMockRedshift: true
    }, true);
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