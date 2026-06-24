'use client';

import { useEffect, useState } from 'react';
import type { Recording } from '@/types';

export function AudioPlayer({ recording }: { recording?: Recording }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!recording) return;
    const objectUrl = URL.createObjectURL(recording.blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [recording]);

  if (!recording || !url) {
    return <p className="text-muted">No local recording found.</p>;
  }

  return (
    <audio className="w-full" controls preload="metadata" src={url}>
      <track kind="captions" />
      Your browser does not support audio playback.
    </audio>
  );
}
