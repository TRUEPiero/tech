export function webpSrcSet(src: string) {
  const base = src.replace(/\.png$/i, "");
  return `${base}-480.webp 480w, ${base}-960.webp 960w`;
}
