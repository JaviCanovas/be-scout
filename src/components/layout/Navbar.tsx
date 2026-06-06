'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Users, Database, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLink {
    label: string;
    href: string;
    icon: React.ReactNode;
    matchPaths: string[];
}

const navLinks: NavLink[] = [
    {
        label: 'Gestión de Jugadores Propios',
        href: '/gestion-plantilla',
        icon: <Users className="w-4 h-4" />,
        matchPaths: ['/gestion-plantilla'],
    },
    {
        label: 'Base de Datos',
        href: '/',
        icon: <Database className="w-4 h-4" />,
        matchPaths: ['/', '/player'],
    },
    {
        label: 'Gestión de Jugadores Seguidos',
        href: '/jugadores-seguidos',
        icon: <ClipboardList className="w-4 h-4" />,
        matchPaths: ['/jugadores-seguidos'],
    },
];

export function Navbar() {
    const pathname = usePathname();

    const isActive = (link: NavLink) => {
        if (link.href === '/' && pathname === '/') return true;
        if (link.href !== '/') return link.matchPaths.some(p => pathname.startsWith(p));
        // For home, also match /player/* routes
        return link.matchPaths.some(p => p !== '/' && pathname.startsWith(p));
    };

    return (
        <nav className="sticky top-0 z-50 bg-[var(--color-bescout-card)]/95 backdrop-blur-md border-b border-[var(--color-bescout-border)]">
            <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between h-14">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 shrink-0 group">
                    <Shield className="w-6 h-6 text-[var(--color-bescout-cyan)] transition-transform group-hover:scale-110" />
                    <span className="font-bold text-lg tracking-wider text-white">
                        BE<span className="text-[var(--color-bescout-cyan)]">SCOUT</span>
                    </span>
                </Link>

                {/* Navigation Links */}
                <div className="flex items-center gap-1 ml-8">
                    {navLinks.map((link) => {
                        const active = isActive(link);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                                    active
                                        ? 'text-white bg-white/5'
                                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                                )}
                            >
                                <span className={cn(
                                    'transition-colors',
                                    active ? 'text-[var(--color-bescout-cyan)]' : ''
                                )}>
                                    {link.icon}
                                </span>
                                <span className="hidden md:inline">{link.label}</span>

                                {/* Active indicator bar */}
                                {active && (
                                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[var(--color-bescout-cyan)] rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* User Area */}
                <div className="flex items-center gap-2 text-sm text-zinc-300 shrink-0">
                    <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <span className="hidden sm:inline text-zinc-400">Admin</span>
                </div>
            </div>
        </nav>
    );
}
