import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 24): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

export const Icon = {
  Tool: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
  ),
  Building: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 21V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v12M9 7h2M9 11h2M9 15h2" /></svg>
  ),
  Camera: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
  ),
  Upload: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
  ),
  Phone: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
  ),
  MapPin: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
  ),
  Map: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M9 18V5l12-2v13M9 9l12-2M3 21l6-3 6 3 6-3V3l-6 3-6-3-6 3v15z" /></svg>
  ),
  Shield: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
  ),
  ShieldCheck: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
  ),
  Check: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M20 6L9 17l-5-5" /></svg>
  ),
  CheckCircle: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
  ),
  X: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M18 6L6 18M6 6l12 12" /></svg>
  ),
  AlertTriangle: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></svg>
  ),
  Users: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  Briefcase: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
  ),
  Activity: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
  ),
  LifeBuoy: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><circle cx="12" cy="12" r="10" /><path d="M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M14.83 9.17l4.24-4.24M9.17 14.83l-4.24 4.24" /><circle cx="12" cy="12" r="4" /></svg>
  ),
  Heart: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
  ),
  FileText: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>
  ),
  Search: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
  ),
  ArrowRight: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
  ),
  ArrowLeft: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
  ),
  Star: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
  ),
  Clock: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
  ),
  TrendingUp: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M23 6l-9.5 9.5-5-5L1 18" /><path d="M17 6h6v6" /></svg>
  ),
  Navigation: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M3 11l19-9-9 19-2-8-8-2z" /></svg>
  ),
  Lock: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
  ),
  Settings: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
  ),
  LogOut: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
  ),
  Plus: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M12 5v14M5 12h14" /></svg>
  ),
  Filter: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
  ),
  Eye: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
  ),
  Send: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
  ),
  Home: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></svg>
  ),
  Award: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><circle cx="12" cy="8" r="7" /><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" /></svg>
  ),
  Info: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
  ),
  MessageSquare: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
  ),
  QrCode: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v7h-7M17 21v.01M21 17v.01" /></svg>
  ),
  Globe: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
  ),
  ChevronRight: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M9 18l6-6-6-6" /></svg>
  ),
  ChevronDown: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M6 9l6 6 6-6" /></svg>
  ),
  RefreshCw: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
  ),
  Wifi: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" /></svg>
  ),
  WifiOff: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" /></svg>
  ),
  Image: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
  ),
  User: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  ),
  PhoneCall: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /><path d="M22 2v6M22 2h-6" /></svg>
  ),
  HelpCircle: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" /></svg>
  ),
  Flag: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" /></svg>
  ),
  Layers: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
  ),
  Crosshair: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><circle cx="12" cy="12" r="10" /><path d="M22 12h-4M6 12H2M12 6V2M12 22v-4" /></svg>
  ),
  Play: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p} fill="currentColor" stroke="none"><path d="M8 5v14l11-7z" /></svg>
  ),
  HardHat: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M2 18a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1zM10 17V9a2 2 0 0 1 4 0v8M4 17a8 8 0 0 1 16 0" /></svg>
  ),
  Trash2: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" /></svg>
  ),
  Pencil: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
  ),
};
