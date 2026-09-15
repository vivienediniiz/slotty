"use client";

import { useState } from "react";
import Image from "next/image";

interface UploadedMedia {
  url: string;
  type: "IMAGE" | "VIDEO";
  size: number;
}

export function MediaUpload({ onMediaAdded }: { onMediaAdded: (media: UploadedMedia) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/social/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      const type = file.type.startsWith("video/") ? "VIDEO" : "IMAGE";

      onMediaAdded({
        url: data.url,
        type,
        size: data.size
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block">
        <div className="relative inline-block cursor-pointer rounded bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          {uploading ? "Uploading..." : "Add Media"}
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleUpload}
            disabled={uploading}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </div>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
