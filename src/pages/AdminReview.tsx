import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { auth, database } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ReviewItem {
  userId: string;
  questionKey: string;
  audioUrl?: string;
  storagePath?: string;
  transcript?: string;
  expectedAnswers?: string[];
}

interface ReviewRecord {
  reviewerId: string;
  reviewerEmail?: string | null;
  correctedTranscript: string;
  isCorrect: boolean;
  reviewedAt: string;
  audioUrl?: string | null;
  storagePath?: string | null;
  mark?: number;
  maxMark?: number;
}

export default function AdminReview() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  // edits will include correctedTranscript, optional mark and maxMark
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [edits, setEdits] = useState<Record<string, { correctedTranscript?: string; isCorrect?: boolean; mark?: number; maxMark?: number }>>({});

  const ADMIN_EMAIL = 'admin@exametric.com';

  // New: list of users with progress and currently selected user
  const [userList, setUserList] = useState<Array<{ uid: string; email?: string; name?: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        let isAdmin = user.email === ADMIN_EMAIL;
        try {
          const idTokenResult = await auth.currentUser?.getIdTokenResult();
          if (idTokenResult?.claims?.admin) isAdmin = true;
        } catch (e: unknown) {
          // ignore token claim read errors
        }

        if (!isAdmin) {
          alert('Access denied: this page is for admins only.');
          window.location.href = '/';
          return;
        }

        // load list of users with progress
        await loadUserList();
      } catch (err: unknown) {
        console.error('Admin check failed', err);
        alert('Access check failed');
        window.location.href = '/';
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load list of users who have entries under examProgress and include user profile if available
  const loadUserList = async () => {
    setLoading(true);
    try {
      const snap = await get(ref(database, 'examProgress'));
      const data = snap.val() || {};
      const uids = Object.keys(data || {});
      const list: Array<{ uid: string; email?: string; name?: string }> = [];

      for (const uid of uids) {
        try {
          const userSnap = await get(ref(database, `users/${uid}`));
          const u = userSnap.exists() ? userSnap.val() : null;
          list.push({ uid, email: u?.email, name: u?.name });
        } catch (e) {
          list.push({ uid });
        }
      }

      setUserList(list);
      // auto-select uid from query param if present, otherwise first
      const uidFromQuery = searchParams.get('uid');
      if (uidFromQuery && list.find((x) => x.uid === uidFromQuery)) {
        setSelectedUserId(uidFromQuery);
        await loadUserAnswers(uidFromQuery);
      } else if (list.length > 0) {
        setSelectedUserId(list[0].uid);
        await loadUserAnswers(list[0].uid);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Failed to load user list', err);
    } finally {
      setLoading(false);
    }
  };

  // Load answers for a specific user from examProgress/{uid}/answers
  const loadUserAnswers = async (uid: string) => {
    setLoading(true);
    try {
      const snap = await get(ref(database, `examProgress/${uid}/answers`));
      const data = snap.val() || {};
      const collected: ReviewItem[] = [];

      Object.keys(data || {}).forEach((qk) => {
        const a = data[qk] as Record<string, unknown> | undefined;
        if (!a) return;
        const review = (a['review']) as Record<string, unknown> | undefined;
        // keep all answers for simplicity (admins can ignore reviewed ones)
        const audioUrl = typeof a['audioUrl'] === 'string' ? a['audioUrl'] as string : undefined;
        const storagePath = typeof a['storagePath'] === 'string' ? a['storagePath'] as string : undefined;
        const transcript = typeof a['text'] === 'string' ? a['text'] as string : undefined;
        const expectedAnswers = Array.isArray(a['expectedAnswers']) ? (a['expectedAnswers'] as string[]) : undefined;

        if (audioUrl || transcript) {
          collected.push({
            userId: uid,
            questionKey: qk,
            audioUrl,
            storagePath,
            transcript,
            expectedAnswers,
          });
        }
      });

      setItems(collected);
    } catch (err) {
      console.error('Failed to load progress for user', uid, err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = async (uid: string) => {
    setSelectedUserId(uid);
    await loadUserAnswers(uid);
  };

  const handleChange = (key: string, value: string) => {
    setEdits((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), correctedTranscript: value } }));
  };

  const handleMarkInput = (key: string, markVal: string) => {
    const n = Number(markVal);
    setEdits((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), mark: Number.isFinite(n) ? n : undefined } }));
  };

  const handleMaxMarkInput = (key: string, maxVal: string) => {
    const n = Number(maxVal);
    setEdits((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), maxMark: Number.isFinite(n) ? n : undefined } }));
  };

  const handleMark = async (item: ReviewItem, isCorrect: boolean) => {
    if (!user) return;
    const key = `${item.userId}__${item.questionKey}`;
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      const corrected = edits[key]?.correctedTranscript ?? item.transcript ?? '';
      const mark = typeof edits[key]?.mark === 'number' ? edits[key]!.mark : undefined;
      const maxMark = typeof edits[key]?.maxMark === 'number' ? edits[key]!.maxMark : undefined;
      const review: ReviewRecord = {
        reviewerId: user.id,
        reviewerEmail: user.email,
        correctedTranscript: corrected,
        isCorrect,
        reviewedAt: new Date().toISOString(),
        audioUrl: item.audioUrl || null,
        storagePath: item.storagePath || null,
        mark,
        maxMark,
      };

      await set(ref(database, `audioReviews/${item.userId}/${item.questionKey}`), review);
      // Also write review back to examProgress so it won't show up in unreviewed list
      await set(ref(database, `examProgress/${item.userId}/answers/${item.questionKey}/review`), review);

      // ALSO: update any existing examResults for this user that contain this questionKey
      try {
        const resultsSnap = await get(ref(database, `examResults/${item.userId}`));
        if (resultsSnap.exists()) {
          const resultsObj = resultsSnap.val() as Record<string, any>;
          // For each result, if it contains the questionKey in its answers, write/update analysis
          await Promise.all(Object.keys(resultsObj).map(async (resultId) => {
            const result = resultsObj[resultId];
            if (!result || !result.answers) return;
            if (result.answers[item.questionKey]) {
              const analysisEntry: Record<string, unknown> = {
                correct: isCorrect,
                userAnswer: result.answers[item.questionKey].text || (item.audioUrl ? 'Audio response' : ''),
                expectedAnswers: result.answers[item.questionKey].expectedAnswers || item.expectedAnswers || [],
                reviewerId: user.id,
                reviewerEmail: user.email || null,
                correctedTranscript: corrected,
                reviewedAt: review.reviewedAt,
              };
              if (typeof mark === 'number') analysisEntry.mark = mark;
              if (typeof maxMark === 'number') analysisEntry.maxMark = maxMark;

              await set(ref(database, `examResults/${item.userId}/${resultId}/analysis/${item.questionKey}`), analysisEntry);

              // Recompute aggregate score for this result based on analysis marks (if present)
              try {
                const analysisSnap = await get(ref(database, `examResults/${item.userId}/${resultId}/analysis`));
                if (analysisSnap.exists()) {
                  const analysisObj = analysisSnap.val() as Record<string, any>;
                  let sumMarks = 0;
                  let sumMax = 0;
                  let countCorrect = 0;
                  Object.values(analysisObj).forEach((a) => {
                    if (a && typeof a === 'object') {
                      const am: number = typeof a.mark === 'number' ? a.mark : (typeof a.correct === 'boolean' && a.correct ? 1 : 0);
                      const amax: number = typeof a.maxMark === 'number' ? a.maxMark : (typeof a.mark === 'number' ? 1 : 1);
                      sumMarks += am;
                      sumMax += amax;
                      if ((typeof a.mark === 'number' && a.mark > 0) || a.correct) countCorrect++;
                    }
                  });
                  const percent = sumMax > 0 ? Math.round((sumMarks / sumMax) * 100) : 0;
                  await set(ref(database, `examResults/${item.userId}/${resultId}/score`), percent);
                  await set(ref(database, `examResults/${item.userId}/${resultId}/correctAnswers`), countCorrect);
                }
              } catch (e) {
                console.warn('Failed to recompute score for result', resultId, e);
              }
            }
          }));
        }
      } catch (err) {
        console.warn('Failed to update examResults analysis for user', item.userId, err);
      }

      setSaving((s) => ({ ...s, [key]: false }));
      alert('Saved review');

      // reload list for the selected user
      if (selectedUserId) await loadUserAnswers(selectedUserId);
    } catch (err) {
      console.error('Failed to save review', err);
      setSaving((s) => ({ ...s, [key]: false }));
      alert('Failed to save review');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Admin: Audio Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Pending audio answers</h2>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedUserId ?? ''}
                    onChange={(e) => handleUserChange(e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="">Select user</option>
                    {userList.map((u) => (
                      <option key={u.uid} value={u.uid}>{u.email ?? u.name ?? u.uid}</option>
                    ))}
                  </select>

                  <Button onClick={() => loadUserList()} className="mr-2">Refresh Users</Button>
                  <Button onClick={() => selectedUserId ? loadUserAnswers(selectedUserId) : loadUserList()}>Refresh</Button>
                </div>
              </div>

              {loading && <p>Loading...</p>}

              {!loading && items.length === 0 && <p>No audio answers found.</p>}

              {items.map((it) => {
                const key = `${it.userId}__${it.questionKey}`;
                return (
                  <div key={key} className="p-4 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm text-muted-foreground">User: {it.userId}</div>
                        <div className="text-sm text-muted-foreground">Question: {it.questionKey}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {it.audioUrl ? (
                          <audio src={it.audioUrl} controls />
                        ) : (
                          <span className="text-xs text-muted-foreground">No audio URL</span>
                        )}
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="text-sm font-medium">Expected answers:</div>
                      <div className="text-sm">{(it.expectedAnswers || []).join(', ') || '—'}</div>
                    </div>

                    <div className="mb-2">
                      <div className="text-sm font-medium">Auto transcript:</div>
                      <div className="text-sm">{it.transcript || '—'}</div>
                    </div>

                    <div className="mb-2">
                      <div className="text-sm font-medium">Corrected transcript (manual):</div>
                      <Input value={(edits[key]?.correctedTranscript) ?? it.transcript ?? ''} onChange={(e) => handleChange(key, e.target.value)} />
                    </div>

                    <div className="mb-2 grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-sm font-medium">Mark:</div>
                        <Input type="number" min="0" value={typeof edits[key]?.mark === 'number' ? edits[key]!.mark : ''} onChange={(e) => handleMarkInput(key, e.target.value)} />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Max Mark:</div>
                        <Input type="number" min="0" value={typeof edits[key]?.maxMark === 'number' ? edits[key]!.maxMark : ''} onChange={(e) => handleMaxMarkInput(key, e.target.value)} />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => handleMark(it, true)} disabled={!!saving[key]}>Mark Correct</Button>
                      <Button variant="destructive" onClick={() => handleMark(it, false)} disabled={!!saving[key]}>Mark Incorrect</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
