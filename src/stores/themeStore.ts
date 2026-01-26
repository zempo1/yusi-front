import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 主题类型定义
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
    mode: ThemeMode;
}

interface ThemeStore extends ThemeConfig {
    setMode: (mode: ThemeMode) => void;
    getEffectiveMode: () => 'light' | 'dark';
}

// 检测系统主题
const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
};

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set, get) => ({
            mode: 'system',

            setMode: (mode) => {
                set({ mode });
                applyTheme(get());
            },

            getEffectiveMode: () => {
                const { mode } = get();
                return mode === 'system' ? getSystemTheme() : mode;
            },
        }),
        {
            name: 'yusi-theme',
        }
    )
);

// 应用主题到 DOM
export const applyTheme = (config: ThemeConfig) => {
    const root = document.documentElement;
    const effectiveMode = config.mode === 'system' ? getSystemTheme() : config.mode;

    // 设置暗色/亮色模式
    if (effectiveMode === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
    } else {
        root.classList.remove('dark');
        root.classList.add('light');
    }
};

// 初始化主题
export const initializeTheme = () => {
    const stored = localStorage.getItem('yusi-theme');
    if (stored) {
        try {
            const config = JSON.parse(stored).state as ThemeConfig;
            applyTheme(config);
        } catch {
            applyTheme({
                mode: 'system',
            });
        }
    } else {
        // Default to system if no storage
        applyTheme({ mode: 'system' });
    }

    // 监听系统主题变化
    if (typeof window !== 'undefined' && window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            const { mode } = useThemeStore.getState();
            if (mode === 'system') {
                applyTheme(useThemeStore.getState());
            }
        });
    }
};
