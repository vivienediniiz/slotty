"use client";

import { useRef, useState } from "react";
import type { MediaItem } from "@/types";

type Props = {
  media: MediaItem[];
  onChange: (media: MediaItem[]) => void;
};

export function MediaDropzone({ media, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function uploadFiles(files: FileList | File[]) {
    setUploading(true);
    const newMedia: MediaItem[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) continue;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/social/upload", {
          method: "POST",
          body: formData
        });

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        newMedia.push({
          id: data.url,
          file,
          previewUrl: data.url,
          type: file.type.startsWith("video/") ? ("video" as const) : ("image" as const)
        });
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    if (newMedia.length > 0) {
      onChange([...media, ...newMedia]);
    }
    setUploading(false);
  }

  function addFiles(files: FileList | File[]) {
    uploadFiles(files);
  }

  function removeMedia(id: string) {
    onChange(media.filter((item) => item.id !== id));
  }

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
        Mídias
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed p-6 text-center transition ${
          isDragging
            ? "border-[#E56BB4] bg-white"
            : "border-black/10 bg-brand-surface hover:border-black/20"
        }`}
      >
        <span className="text-2xl">📎</span>
        <p className="text-xs font-medium text-brand-ink/70">
          Arraste imagens ou vídeos aqui
        </p>
        <p className="text-[11px] text-brand-muted">ou clique para selecionar arquivos</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {media.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {media.map((item) => (
            <div key={item.id} className="group relative aspect-square overflow-hidden rounded-xl bg-black/5">
              {item.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <video src={item.previewUrl} className="h-full w-full object-cover" muted />
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeMedia(item.id);
                }}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] text-white opacity-0 transition group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
