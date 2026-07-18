import { downloadText } from './download';
import { buildFullExport } from './fullExport';

export async function exportLocalData() {
  const data = await buildFullExport();
  const filename = `nugget-full-export-${data.exportedAt.slice(0, 10)}.json`;
  downloadText(filename, JSON.stringify(data, null, 2), 'application/json');
  return { exportedAt: data.exportedAt, filename };
}
