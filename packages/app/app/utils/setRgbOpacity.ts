export function setRgbOpacity(color: string, newOpacity: number) {
    const match = color.match(/rgb[a]?\(([^)]+)\)/);
    if (!match) return color;

    const parts = match[1]
        .replace(/\//g, ',')
        .split(/[,\s]+/)
        .filter(Boolean);

    const [r, g, b] = parts;

    return `rgb(${r} ${g} ${b} / ${newOpacity})`;
}
