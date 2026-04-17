import type { ApiAppointmentFull } from './appointmentApi';
import type { ApiClientRow } from './clientApi';
import { readV1ErrorMessage, v1Headers, V1_BASE } from './httpV1';

/** `GET /api/v1/sessions/:appointmentId` — Ghost Notes Screen 2 payload. */
export type GhostNotesSessionData = {
  sessionId: string;
  appointmentId: string;
  engine: 'GHOST_NOTES';
  client: ApiClientRow;
  appointment: ApiAppointmentFull & {
    media?: {
      beforeUrl?: string | null;
      afterUrl?: string | null;
      beforeCapturedAt?: string | null;
      afterCapturedAt?: string | null;
    } | null;
  };
  priorVisitSummary: {
    appointmentId: string;
    startAt: string;
    serviceNames: string[];
    notesSnippet: string;
  } | null;
  followUpQuestions: string[];
};

export async function getGhostNotesSession(
  token: string,
  salonId: string,
  appointmentId: string,
): Promise<{ data: GhostNotesSessionData }> {
  const r = await fetch(`${V1_BASE}/sessions/${encodeURIComponent(appointmentId)}`, {
    method: 'GET',
    headers: v1Headers(token, salonId),
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: GhostNotesSessionData }>;
}

export async function patchGhostNotesSession(
  token: string,
  salonId: string,
  sessionId: string,
  body: Record<string, unknown>,
): Promise<{ data: ApiAppointmentFull }> {
  const r = await fetch(`${V1_BASE}/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'PATCH',
    headers: v1Headers(token, salonId),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: ApiAppointmentFull }>;
}

export async function completeGhostNotesSession(
  token: string,
  salonId: string,
  sessionId: string,
): Promise<{
  data:
    | { alreadyCompleted: true; appointmentId: string }
    | {
        alreadyCompleted: false;
        appointmentId: string;
        engineDispatchQueued: readonly string[];
      };
}> {
  const r = await fetch(`${V1_BASE}/sessions/${encodeURIComponent(sessionId)}/complete`, {
    method: 'POST',
    headers: v1Headers(token, salonId),
    body: '{}',
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{
    data:
      | { alreadyCompleted: true; appointmentId: string }
      | { alreadyCompleted: false; appointmentId: string; engineDispatchQueued: readonly string[] };
  }>;
}

export type AiSource = 'openai' | 'rules';

export async function postGhostNotesFollowUpQuestions(
  token: string,
  salonId: string,
  body: {
    last_service?: string;
    days_since_last_visit?: number;
    formula_notes?: string;
    client_notes?: string;
  },
): Promise<{ data: { questions: string[]; source: AiSource } }> {
  const r = await fetch(`${V1_BASE}/ai/followup-questions`, {
    method: 'POST',
    headers: v1Headers(token, salonId),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: { questions: string[]; source: AiSource } }>;
}

export async function postGhostNotesCareInstructions(
  token: string,
  salonId: string,
  body: {
    services_performed?: string[];
    back_bar_products?: string[];
    client_notes?: string;
  },
): Promise<{ data: { careInstructions: string; source: AiSource } }> {
  const r = await fetch(`${V1_BASE}/ai/care-instructions`, {
    method: 'POST',
    headers: v1Headers(token, salonId),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: { careInstructions: string; source: AiSource } }>;
}

export async function postGhostNotesRebookInterval(
  token: string,
  salonId: string,
  body: { service_type?: string; visit_history?: { startAt?: string }[] },
): Promise<{ data: { interval_days: number; suggested_service: string; source: AiSource } }> {
  const r = await fetch(`${V1_BASE}/ai/rebook-interval`, {
    method: 'POST',
    headers: v1Headers(token, salonId),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{
    data: { interval_days: number; suggested_service: string; source: AiSource };
  }>;
}

/** Brain health — optional dashboard polling. */
export async function getGhostNotesPulse(
  token: string,
  salonId: string,
): Promise<{
  data: {
    engine: string;
    status: string;
    updatedAt: string;
    observations: unknown[];
    metrics: Record<string, number>;
  };
}> {
  const r = await fetch(`${V1_BASE}/ghost-notes/pulse`, {
    method: 'GET',
    headers: v1Headers(token, salonId),
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{
    data: {
      engine: string;
      status: string;
      updatedAt: string;
      observations: unknown[];
      metrics: Record<string, number>;
    };
  }>;
}
