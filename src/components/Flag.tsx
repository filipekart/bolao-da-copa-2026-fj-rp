import { memo } from 'react';

interface FlagProps {
  src?: string | null;
  alt?: string;
  className?: string;
  /** Hint para o navegador escolher densidade (ex: "24px"). */
  width?: number;
  height?: number;
}

/**
 * Bandeira otimizada:
 * - width/height fixos para evitar layout shift
 * - decoding async + lazy loading
 * - fallback transparente quando src falha
 */
function FlagComponent({ src, alt = '', className = '', width = 24, height = 16 }: FlagProps) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={className}
      onError={(e) => {
        // Esconde silenciosamente se falhar (ex: TBD ou rede off)
        (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
      }}
    />
  );
}

export const Flag = memo(FlagComponent);