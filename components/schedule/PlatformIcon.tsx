import type { Platform } from "@/types";

type Props = {
  platform: Platform;
  className?: string;
};

export function PlatformIcon({ platform, className = "h-6 w-6" }: Props) {
  const iconProps = { className, viewBox: "0 0 24 24", fill: "currentColor" };

  switch (platform.toLowerCase()) {
    case "facebook":
      return (
        <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );

    case "instagram":
      return (
        <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
          <rect x="2.16" y="2.16" width="19.68" height="19.68" rx="4.8" ry="4.8" fill="url(#ig-gradient)" />
          <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" fill="white" />
          <circle cx="17.5" cy="6.5" r="1.5" fill="white" />
          <defs>
            <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#feda75" />
              <stop offset="5%" stopColor="#fa7e1e" />
              <stop offset="45%" stopColor="#d92e7f" />
              <stop offset="60%" stopColor="#9b36b7" />
              <stop offset="90%" stopColor="#515bd4" />
            </linearGradient>
          </defs>
        </svg>
      );

    case "linkedin":
      return (
        <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.004 1.424-.103.249-.129.597-.129.946v5.435h-3.554s.047-8.821 0-9.745h3.554v1.38c-.429-.686-1.195-1.645-2.905-1.645-2.12 0-3.71 1.389-3.71 4.375v5.635H.455V.023h3.556v9.96c1.042-1.61 2.905-3.935 7.046-3.935 5.143 0 9.005 3.071 9.005 9.677v4.728zM2.034 0a2.034 2.034 0 1 0 .001 4.068A2.034 2.034 0 0 0 2.034 0zm1.722 20.452H.309V6.734h3.447v13.718zM23.991 0v24h-24V0h24z" />
        </svg>
      );

    case "threads":
      return (
        <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8m3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5m-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11m3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
        </svg>
      );

    default:
      return (
        <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
  }
}
