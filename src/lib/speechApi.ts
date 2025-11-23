import { auth } from './firebase';

export async function uploadAudioForTranscription(file: Blob, metadata: Record<string, unknown>) {
  // Get current user's ID token
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');
  const token = await currentUser.getIdToken();

  // Convert file blob to base64
  const base64Audio = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  if (!base64Audio) throw new Error('Failed to encode audio');

  const functionUrl = import.meta.env.VITE_SPEECH_FUNCTION_URL;
  if (!functionUrl) throw new Error('Speech function URL not configured');

  const res = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ audio: base64Audio, metadata }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    let message = `Request failed: ${res.status}`;
    try {
      const parsed = JSON.parse(errBody || '{}');
      message = parsed.error || parsed.message || message;
    } catch {
      if (errBody) message = errBody;
    }
    throw new Error(message);
  }

  return res.json();
}
