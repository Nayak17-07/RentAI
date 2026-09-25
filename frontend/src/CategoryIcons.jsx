import React from 'react';

export const CategoryIcon = ({ type, size = 48 }) => {
  switch (type) {
    case 'Water Purifiers':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="18" y="10" width="28" height="42" rx="5" fill="#262626" />
          <rect x="22" y="15" width="20" height="18" rx="3" fill="#171717" />
          <circle cx="32" cy="24" r="3" fill="#0284c7" />
          <path d="M32 21L33.5 24H30.5L32 21Z" fill="#38bdf8" />
          <rect x="29" y="36" width="6" height="4" rx="1" fill="#737373" />
          <path d="M32 40V43" stroke="#a3a3a3" strokeWidth="2" strokeLinecap="round" />
          <path d="M30 44H34L33 49H31L30 44Z" fill="#38bdf8" opacity="0.8" />
        </svg>
      );

    case 'Sofas':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="12" y="24" width="40" height="20" rx="4" fill="#d97706" />
          <rect x="8" y="28" width="8" height="16" rx="3" fill="#b45309" />
          <rect x="48" y="28" width="8" height="16" rx="3" fill="#b45309" />
          <rect x="16" y="32" width="15" height="12" rx="2" fill="#f59e0b" />
          <rect x="33" y="32" width="15" height="12" rx="2" fill="#f59e0b" />
          <line x1="14" y1="44" x2="11" y2="52" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="44" x2="53" y2="52" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'Beds':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="16" width="44" height="22" rx="3" fill="#78350f" />
          <rect x="12" y="32" width="40" height="16" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <rect x="15" y="24" width="15" height="8" rx="2" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
          <rect x="34" y="24" width="15" height="8" rx="2" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
          <path d="M12 36H52V48H12V36Z" fill="#3b82f6" opacity="0.85" />
          <line x1="12" y1="48" x2="12" y2="54" stroke="#451a03" strokeWidth="3" strokeLinecap="round" />
          <line x1="52" y1="48" x2="52" y2="54" stroke="#451a03" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'Washing Machines':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="16" y="10" width="32" height="44" rx="4" fill="#374151" />
          <rect x="20" y="14" width="16" height="5" rx="1" fill="#111827" />
          <circle cx="42" cy="16.5" r="2.5" fill="#e23744" />
          <circle cx="32" cy="35" r="13" fill="#1f2937" stroke="#9ca3af" strokeWidth="2.5" />
          <circle cx="32" cy="35" r="9" fill="#0284c7" opacity="0.6" />
          <path d="M28 32C30 30 34 30 36 32" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'Refrigerators & Freezers':
    case 'Refrigerators':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="18" y="8" width="28" height="48" rx="4" fill="#475569" />
          <line x1="18" y1="26" x2="46" y2="26" stroke="#1e293b" strokeWidth="2" />
          <rect x="21" y="16" width="2" height="6" rx="1" fill="#cbd5e1" />
          <rect x="21" y="32" width="2" height="12" rx="1" fill="#cbd5e1" />
          <rect x="34" y="14" width="8" height="6" rx="1" fill="#0284c7" opacity="0.5" />
        </svg>
      );

    case 'Televisions':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="14" width="48" height="30" rx="3" fill="#0f172a" />
          <rect x="10" y="16" width="44" height="26" rx="2" fill="#1e293b" />
          <path d="M12 40L24 26L34 36L44 24L52 34V40H12Z" fill="#38bdf8" opacity="0.5" />
          <path d="M28 44H36L38 52H26L28 44Z" fill="#475569" />
          <rect x="22" y="51" width="20" height="2" rx="1" fill="#334155" />
        </svg>
      );

    case 'Air Conditioners':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="22" width="48" height="18" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <rect x="12" y="34" width="40" height="3" rx="1" fill="#94a3b8" />
          <text x="42" y="29" fill="#0284c7" fontSize="5" fontWeight="bold">24°</text>
          <path d="M16 43C18 47 22 47 24 43" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M28 43C30 47 34 47 36 43" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M40 43C42 47 46 47 48 43" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'Chairs & Stools':
    case 'Chairs':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="10" width="24" height="24" rx="4" fill="#1f2937" stroke="#4b5563" strokeWidth="1.5" />
          <rect x="18" y="32" width="28" height="6" rx="2" fill="#111827" />
          <rect x="30" y="38" width="4" height="10" fill="#9ca3af" />
          <path d="M20 52L32 48L44 52" stroke="#4b5563" strokeWidth="3" strokeLinecap="round" />
          <circle cx="20" cy="52" r="2" fill="#111827" />
          <circle cx="44" cy="52" r="2" fill="#111827" />
          <circle cx="32" cy="52" r="2" fill="#111827" />
        </svg>
      );

    case 'Study Tables':
    case 'Tables':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="22" width="44" height="6" rx="2" fill="#b45309" />
          <rect x="36" y="28" width="16" height="10" rx="1" fill="#78350f" />
          <circle cx="44" cy="33" r="1.5" fill="#fef3c7" />
          <line x1="14" y1="28" x2="14" y2="52" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="38" x2="50" y2="52" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'Center Tables':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="32" cy="26" rx="22" ry="8" fill="#d97706" />
          <line x1="22" y1="32" x2="16" y2="50" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
          <line x1="32" y1="34" x2="32" y2="52" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
          <line x1="42" y1="32" x2="48" y2="50" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'Bedside Tables':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="24" width="24" height="22" rx="2" fill="#78350f" />
          <rect x="22" y="27" width="20" height="8" rx="1" fill="#92400e" />
          <rect x="22" y="37" width="20" height="7" rx="1" fill="#92400e" />
          <circle cx="32" cy="31" r="1.5" fill="#fef3c7" />
          <circle cx="32" cy="40.5" r="1.5" fill="#fef3c7" />
          <line x1="22" y1="46" x2="20" y2="52" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="42" y1="46" x2="44" y2="52" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
          {/* Lamp */}
          <path d="M28 24H36L34 16H30L28 24Z" fill="#f59e0b" />
          <line x1="32" y1="16" x2="32" y2="24" stroke="#d97706" strokeWidth="1.5" />
        </svg>
      );

    case 'Chest of Drawers':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="16" y="16" width="32" height="34" rx="2" fill="#78350f" />
          <rect x="18" y="18" width="28" height="6.5" rx="1" fill="#92400e" />
          <rect x="18" y="26" width="28" height="6.5" rx="1" fill="#92400e" />
          <rect x="18" y="34" width="28" height="6.5" rx="1" fill="#92400e" />
          <rect x="18" y="42" width="28" height="6.5" rx="1" fill="#92400e" />
          <circle cx="32" cy="21.2" r="1.5" fill="#fef3c7" />
          <circle cx="32" cy="29.2" r="1.5" fill="#fef3c7" />
          <circle cx="32" cy="37.2" r="1.5" fill="#fef3c7" />
          <circle cx="32" cy="45.2" r="1.5" fill="#fef3c7" />
          <line x1="18" y1="50" x2="16" y2="54" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="46" y1="50" x2="48" y2="54" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'Mattresses':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="26" width="44" height="14" rx="4" fill="#ef4444" />
          <line x1="10" y1="33" x2="54" y2="33" stroke="#b91c1c" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="18" y1="26" x2="18" y2="40" stroke="#b91c1c" strokeWidth="1" />
          <line x1="28" y1="26" x2="28" y2="40" stroke="#b91c1c" strokeWidth="1" />
          <line x1="38" y1="26" x2="38" y2="40" stroke="#b91c1c" strokeWidth="1" />
          <line x1="48" y1="26" x2="48" y2="40" stroke="#b91c1c" strokeWidth="1" />
        </svg>
      );

    case 'Wardrobe & Organizer':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="18" y="10" width="28" height="44" rx="2" fill="#78350f" />
          <line x1="32" y1="10" x2="32" y2="54" stroke="#451a03" strokeWidth="1.5" />
          <rect x="28.5" y="28" width="1.5" height="8" rx="0.75" fill="#fef3c7" />
          <rect x="34" y="28" width="1.5" height="8" rx="0.75" fill="#fef3c7" />
          <line x1="20" y1="54" x2="20" y2="58" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="44" y1="54" x2="44" y2="58" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'Microwaves':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="12" y="18" width="40" height="26" rx="3" fill="#18181b" />
          <rect x="15" y="22" width="24" height="18" rx="2" fill="#27272a" />
          <rect x="42" y="22" width="7" height="4" rx="1" fill="#0284c7" opacity="0.6" />
          <circle cx="45.5" cy="30" r="1.5" fill="#71717a" />
          <circle cx="45.5" cy="35" r="1.5" fill="#71717a" />
          <rect x="36" y="25" width="2" height="12" rx="1" fill="#71717a" />
        </svg>
      );

    case 'Packages':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="12" y="22" width="26" height="18" rx="3" fill="#d97706" />
          <rect x="8" y="26" width="6" height="14" rx="2" fill="#b45309" />
          <rect x="34" y="26" width="6" height="14" rx="2" fill="#b45309" />
          <ellipse cx="44" cy="38" rx="10" ry="4" fill="#78350f" />
          <line x1="38" y1="40" x2="36" y2="48" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="40" x2="52" y2="48" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
};
