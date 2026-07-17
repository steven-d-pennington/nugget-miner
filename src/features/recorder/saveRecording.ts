import { CaptureService, type SaveRecordingInput } from '@/lib/services/CaptureService';

export type { SaveRecordingInput } from '@/lib/services/CaptureService';

export async function saveRecording(input: SaveRecordingInput) {
  return CaptureService.saveRecording(input);
}
