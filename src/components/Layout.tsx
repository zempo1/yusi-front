import { type ReactNode, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { cn } from '../utils'
import { Github, LogOut, User as UserIcon, Home, LayoutGrid, Book, Heart, Users, Settings } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Button } from './ui/Button'
import { ChatWidget } from './ChatWidget'
import { ThemeSwitcher } from './ThemeSwitcher'
import { initializeTheme } from '../stores/themeStore'
import { AnimatePresence, motion } from 'framer-motion'


export interface LayoutProps {
  children?: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()

  // 初始化主题
  useEffect(() => {
    initializeTheme()
  }, [])

  const navItems = [
    { label: '首页', href: '/', icon: Home },
    { label: '广场', href: '/plaza', icon: Users },
    { label: '情景室', href: '/room', icon: LayoutGrid },
    { label: 'AI知己', href: '/diary', icon: Book },
    { label: '匹配', href: '/match', icon: Heart },
  ]

  return (
    <div className="flex min-h-screen flex-col font-sans antialiased pb-16 md:pb-0 relative">
      {/* Ambient Background */}
      <div className="bg-ambient" />
      
      <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-xl supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/20">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="mr-4 flex">
            <Link to="/" className="mr-6 flex items-center space-x-2 group">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white font-bold shadow-lg shadow-primary/30 transition-transform group-hover:scale-105 group-hover:rotate-3">Y</span>
              <span className="font-bold text-lg inline-block tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Yusi</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "px-4 py-2 rounded-full transition-all duration-300",
                    pathname === item.href 
                      ? "bg-primary/10 text-primary font-semibold" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-white/10 backdrop-blur-sm">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium hidden md:inline-block">
                      {user.userName}
                    </span>
                  </div>
                  <Link to="/settings">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="设置"
                      className="rounded-full"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      logout()
                      localStorage.removeItem('yusi-user-id')
                    }}
                    title="退出登录"
                    className="rounded-full"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">登录</Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm" className="btn-gradient shadow-lg shadow-primary/20">注册</Button>
                  </Link>
                </div>
              )}

              <Link
                to="https://github.com/Aseubel/yusi"
                target="_blank"
                rel="noreferrer"
                className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-full border border-input bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Link>
              <ThemeSwitcher />
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-background/80 backdrop-blur-xl pb-safe">
        <nav className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors",
                pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-transform duration-300", pathname === item.href && "scale-110")} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {pathname === item.href && (
                <motion.div 
                  layoutId="mobile-nav-indicator"
                  className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                />
              )}
            </Link>
          ))}
        </nav>
      </div>

      <main className="flex-1 container-page py-6 md:py-10 relative z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 15, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(5px)' }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full"
          >
            {children || <Outlet />}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <footer className="py-8 md:px-8 md:py-0 hidden md:block border-t border-white/5">
        <div className="container-page flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by <span className="font-medium underline underline-offset-4 decoration-primary/50"><a href="https://github.com/Aseubel" target="_blank" rel="noreferrer">Aseubel</a></span>. The source code is available on <span className="font-medium underline underline-offset-4 decoration-primary/50">GitHub</span>.
          </p>
        </div>
      </footer>
      <ChatWidget />
    </div>
  )
}