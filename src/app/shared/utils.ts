export function getRootFontSize(): number {
  return parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export function remToPx(rem: number): number {
  const rootFontSize = getRootFontSize();
  return rem * rootFontSize;
}

export function pxToRem(px: number): number {
  const rootFontSize = getRootFontSize();
  return px / rootFontSize;
}

export function getAdjustedFontSize(): number {
  const rootFontSize = parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  ); // Basis-Fontgröße
  const devicePixelRatio = window.devicePixelRatio || 1; // DPI-Faktor
  const zoomLevel = window.outerWidth / window.innerWidth; // Zoom-Faktor des Browsers

  return rootFontSize * devicePixelRatio * zoomLevel;
}

export function getDynamicColumnWidth(
  colspan: number,
  columnWidthRem: number,
  borderSize: number = 0,
): string {
  const rootFontSize = getRootFontSize();
  const baseWidthInPx = remToPx(columnWidthRem * colspan);
  const borderWidthInPx = borderSize * (colspan - 1); // Borders berücksichtigen

  return `${baseWidthInPx + borderWidthInPx}px`;
}
