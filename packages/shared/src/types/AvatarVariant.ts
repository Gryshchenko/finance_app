/**
 * Generated-avatar style. Each value names a drawing routine in the avatar renderer,
 * so a variant outside the set renders nothing at all.
 */
export type AvatarVariant = 'marble' | 'beam' | 'pixel' | 'sunset' | 'ring' | 'bauhaus';

export const AVATAR_VARIANTS: AvatarVariant[] = ['beam', 'marble', 'pixel', 'sunset', 'ring', 'bauhaus'];

// Preset color palettes users can pick from when configuring their avatar.
export const AVATAR_PALETTES: string[][] = [
    ['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90'],
    ['#0A0310', '#49007E', '#FF005B', '#FF7D10', '#FFB238'],
    ['#FF6B6B', '#F7FFF7', '#4ECDC4', '#1A535C', '#FFE66D'],
    ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'],
];

export const DEFAULT_AVATAR_VARIANT: AvatarVariant = 'beam';
export const DEFAULT_AVATAR_COLORS: string[] = AVATAR_PALETTES[0];
