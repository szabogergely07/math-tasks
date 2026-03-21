const { put, list, del } = require('@vercel/blob');

const RESULTS_PREFIX = 'results/';
const HISTORY_PASSWORD = process.env.HISTORY_PASSWORD || 'schule';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function send(res, status, payload) {
  setCors(res);
  return res.status(status).json(payload);
}

async function listAllBlobs(prefix) {
  const all = [];
  let cursor;

  do {
    const result = await list({ prefix, cursor, limit: 1000 });
    all.push(...result.blobs);
    cursor = result.cursor;
  } while (cursor);

  return all;
}

async function readAllResults() {
  const blobs = await listAllBlobs(RESULTS_PREFIX);
  const results = await Promise.all(
    blobs.map(async (blob) => {
      try {
        const response = await fetch(blob.url);
        if (!response.ok) return null;
        return await response.json();
      } catch {
        return null;
      }
    }),
  );

  return results
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAtIso || b.date).getTime() - new Date(a.createdAtIso || a.date).getTime());
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(204).end();
  }

  try {
    if (req.method === 'GET') {
      const results = await readAllResults();
      return send(res, 200, { results });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      if (!body.name) {
        return send(res, 400, { error: 'Name fehlt.' });
      }

      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: body.name,
        modeLabel: body.modeLabel,
        grade: body.grade,
        score: body.score,
        stars: body.stars,
        accuracy: body.accuracy,
        date: body.date,
        createdAtIso: new Date().toISOString(),
      };

      await put(`${RESULTS_PREFIX}${entry.id}.json`, JSON.stringify(entry, null, 2), {
        access: 'public',
        contentType: 'application/json',
      });

      return send(res, 201, { ok: true, entry });
    }

    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      if (body.password !== HISTORY_PASSWORD) {
        return send(res, 403, { error: 'Falsches Passwort.' });
      }

      const blobs = await listAllBlobs(RESULTS_PREFIX);
      if (blobs.length) {
        await del(blobs.map((blob) => blob.url));
      }

      return send(res, 200, { ok: true, deleted: blobs.length });
    }

    return send(res, 405, { error: 'Methode nicht erlaubt.' });
  } catch (error) {
    return send(res, 500, {
      error: 'Serverfehler beim Verarbeiten des Verlaufs.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
