import React from 'react';

interface PlatformIconProps {
  platform: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const TikTokIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.86.97 2 1.69 3.26 2.01v3.9c-1.63-.03-3.23-.58-4.57-1.57-.15-.1-.28-.21-.41-.32v5.77c.07 1.95-.51 3.91-1.66 5.5-1.42 1.92-3.75 3.12-6.13 3.12-2.45-.02-4.8-1.28-6.17-3.32-1.37-2.07-1.6-4.75-.62-7 .96-2.18 3.05-3.72 5.43-3.92.08-.01.16-.01.24-.01v3.97a3.5 3.5 0 0 0-1.8.84c-.95.96-1.34 2.37-.99 3.67.35 1.25 1.48 2.22 2.76 2.41 1.27.19 2.58-.33 3.26-1.41.48-.77.62-1.7.59-2.6V0h3.93Z" />
  </svg>
);

export const InstagramIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export const YoutubeIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
  </svg>
);

export default function PlatformIcon({ platform, size = 'md', showLabel = false }: PlatformIconProps) {
  const normPlatform = platform.toLowerCase();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const wrapperClasses = {
    sm: 'p-1 rounded',
    md: 'p-1.5 rounded-lg',
    lg: 'p-2 rounded-xl',
  };

  const activeSize = sizeClasses[size];

  if (normPlatform === 'tiktok') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-cyan-400 bg-cyan-950/20 border border-cyan-800/30 ${wrapperClasses[size]}`} title="TikTok">
        <TikTokIcon className={activeSize} />
        {showLabel && <span className="text-xs font-medium">TikTok</span>}
      </span>
    );
  }

  if (normPlatform === 'instagram') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-pink-400 bg-pink-950/20 border border-pink-800/30 ${wrapperClasses[size]}`} title="Instagram">
        <InstagramIcon className={activeSize} />
        {showLabel && <span className="text-xs font-medium">Instagram</span>}
      </span>
    );
  }

  if (normPlatform === 'youtube' || normPlatform === 'shorts') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-rose-400 bg-rose-950/20 border border-rose-800/30 ${wrapperClasses[size]}`} title="YouTube Shorts">
        <YoutubeIcon className={activeSize} />
        {showLabel && <span className="text-xs font-medium">YouTube</span>}
      </span>
    );
  }

  return (
    <span className="text-zinc-400">
      {platform}
    </span>
  );
}
