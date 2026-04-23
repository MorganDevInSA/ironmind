/**
 * One-line JSON logs for Vercel / log drains — no PII, no tokens.
 * Use on high-risk orchestration (import, seed failures, optional hot writes).
 */

export type ServiceWriteLogLevel = 'info' | 'warn' | 'error';

export interface ServiceWriteLogPayload {
  domain: string;
  operation: string;
  code?: string;
  jobId?: string;
  completion?: string;
  filesImportedCount?: number;
  errorCount?: number;
}

export function logServiceWrite(
  level: ServiceWriteLogLevel,
  payload: ServiceWriteLogPayload,
): void {
  const entry = {
    ts: new Date().toISOString(),
    source: 'ironmind',
    ...payload,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.info(line);
  }
}
