// Per-server settings, cached in memory and persisted to a JSON file.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ROOT } from '../config.js';

// Allow custom path via env var (useful for Railway volumes)
const SETTINGS_PATH = process.env.SETTINGS_PATH || join(ROOT, 'settings.json');

// Ensure the directory exists (top-level await is fine in ES modules)
try {
  const dir = dirname(SETTINGS_PATH);
  if (dir && dir !== '.') {
    await import('node:fs/promises').then(fs => fs.mkdir(dir, { recursive: true }));
  }
} catch (_) { /* ignore */ }

let cache;
try {
  cache = JSON.parse(readFileSync(SETTINGS_PATH, 'utf8'));
} catch {
  cache = {};
}

function update(guildId, patch) {
  cache[guildId] = { ...cache[guildId], ...patch };
  try {
    writeFileSync(SETTINGS_PATH, JSON.stringify(cache, null, 2));
  } catch (err) {
    console.error('Failed to save settings:', err.message);
  }
}

// Where generated accounts are sent: "dm" (default) or "server".
export function getDelivery(guildId) {
  if (!guildId) return 'dm';
  return cache[guildId]?.delivery ?? 'dm';
}

export function setDelivery(guildId, delivery) {
  update(guildId, { delivery });
}

// Channel ID where generations are logged for this server (null = none set).
export function getLogChannel(guildId) {
  if (!guildId) return null;
  return cache[guildId]?.logChannel ?? null;
}

export function setLogChannel(guildId, channelId) {
  update(guildId, { logChannel: channelId ?? null });
}
