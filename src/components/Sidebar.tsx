'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, FileText, Mic, 
  Calendar, Lightbulb, BarChart3, 
  Settings, Menu, X, Sparkles, Film,
  FolderHeart
} from 'lucide-react';
import { isMockDb } from '@/lib/supabase';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Script Generator', path: '/scripts', icon: FileText },
    { name: 'Audio Generator', path: '/audio', icon: Mic },
    { name: 'Video Generator', path: '/video', icon: Film },
    { name: 'Video Gallery', path: '/gallery', icon: FolderHeart },
    { name: 'Content Calendar', path: '/calendar', icon: Calendar },
    { name: 'Topic Bank', path: '/topics', icon: Lightbulb },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const toggleMobileSidebar = () => setIsOpen(!isOpen);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex flex-col gap-1.5 px-4 py-6">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.path;
        
        return (
          <Link
            key={item.path}
            href={item.path}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group ${
              isActive
                ? 'bg-gradient-to-r from-purple-900/40 to-pink-900/20 text-white border border-purple-500/20 shadow-[0_0_15px_rgba(124,58,237,0.06)]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50 border border-transparent'
            }`}
          >
            <Icon className={`w-5 h-5 transition-colors ${
              isActive ? 'text-purple-400 group-hover:text-purple-300' : 'text-zinc-400 group-hover:text-zinc-200'
            }`} />
            <span>{item.name}</span>
            {isActive && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Top Header (only visible on mobile) */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-purple-500/65 flex items-center justify-center shadow-md overflow-hidden bg-zinc-900 flex-shrink-0">
            <img 
              src="/avatar_park.jpg" 
              alt="Ara Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            Ara Studio
          </span>
        </div>
        <button 
          onClick={toggleMobileSidebar}
          className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Sidebar (Left Panel) */}
      <aside className={`w-64 h-screen fixed left-0 top-0 border-r border-zinc-900 bg-zinc-950/40 backdrop-blur-xl flex flex-col hidden md:flex z-40 ${className}`}>
        {/* Brand Logo */}
        <div className="p-6 border-b border-zinc-900 flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full border-2 border-purple-500 shadow-lg relative overflow-hidden bg-zinc-900 flex-shrink-0">
              <img 
                src="/avatar_park.jpg" 
                alt="Ara Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5 leading-tight">
                Ara Studio
              </h1>
              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Influencer AI
              </p>
            </div>
          </div>
          
          {/* Mock Database indicator (extremely friendly UX) */}
          {isMockDb && (
            <div className="mt-3.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-purple-900/30 text-[10px] text-purple-300 font-medium text-center">
              💾 Mode Uji Coba (Mock DB)
            </div>
          )}
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>

        {/* Footer info */}
        <div className="p-6 border-t border-zinc-900 text-[11px] text-zinc-600 font-medium">
          Ara Studio v1.0.0 &copy; 2026
        </div>
      </aside>

      {/* Mobile Drawer (visible on mobile only, when open) */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            onClick={toggleMobileSidebar}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
          ></div>
          
          {/* Sidebar Panel */}
          <aside className="md:hidden fixed top-0 bottom-0 left-0 w-64 border-r border-zinc-900 bg-zinc-950 z-50 flex flex-col animate-slide-in-right duration-200">
            <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-base text-white">Ara Studio</span>
              </div>
              <button 
                onClick={toggleMobileSidebar}
                className="p-1 rounded-lg text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isMockDb && (
              <div className="mx-4 mt-4 px-3 py-1.5 rounded-lg bg-zinc-900 border border-purple-900/30 text-[10px] text-purple-300 font-medium text-center">
                💾 Mode Uji Coba (Mock DB)
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              <NavLinks onClick={toggleMobileSidebar} />
            </div>

            <div className="p-6 border-t border-zinc-900 text-[10px] text-zinc-600">
              Ara Studio v1.0.0
            </div>
          </aside>
        </>
      )}
    </>
  );
}
