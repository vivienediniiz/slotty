export type Platform = "instagram" | "facebook" | "linkedin" | "threads";

export type PlatformConnection = {
  platform: Platform;
  label: string;
  handle: string | null;
  connected: boolean;
  accountId?: string;
};

export type MediaItem = {
  id: string;
  file: File;
  previewUrl: string;
  type: "image" | "video";
};

export type ScheduleProfile = {
  id: string;
  name: string;
  platform: Platform;
};
