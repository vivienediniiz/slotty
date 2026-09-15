"use client";

import Image from "next/image";

interface Media {
  url: string;
  type: "IMAGE" | "VIDEO";
}

export function MediaGallery({
  media,
  onRemove
}: {
  media: Media[];
  onRemove: (index: number) => void;
}) {
  if (media.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {media.map((item, i) => (
        <div key={i} className="group relative aspect-square overflow-hidden rounded bg-brand-subtle">
          {item.type === "IMAGE" ? (
            <Image
              src={item.url}
              alt={`Media ${i + 1}`}
              fill
              className="object-cover"
            />
          ) : (
            <video src={item.url} className="h-full w-full object-cover" />
          )}

          <button
            onClick={() => onRemove(i)}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
            title="Remove"
          >
            <span className="text-2xl text-white">×</span>
          </button>
        </div>
      ))}
    </div>
  );
}
