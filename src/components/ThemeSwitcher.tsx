import { useThemeStore } from '../stores/themeStore';
import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/Button';

export const ThemeSwitcher = () => {
    const { mode, setMode } = useThemeStore();

    const toggleTheme = () => {
        if (mode === 'dark') {
            setMode('light');
        } else {
            setMode('dark');
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-9 h-9"
            title={mode === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
        >
            {mode === 'dark' ? (
                <Moon className="w-4 h-4" />
            ) : (
                <Sun className="w-4 h-4" />
            )}
        </Button>
    );
};
