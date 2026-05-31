/**
 * Minimal, accessible audio player. We rely on the native <audio> element
 * (which gives play/pause/seek/volume for free) and just style its container.
 */
export function AudioPlayer({ src, className }: { src: string; className?: string }) {
  return (
    <audio controls preload="metadata" src={src} className={className ?? "w-full"}>
      Your browser does not support the audio element.
    </audio>
  );
}
