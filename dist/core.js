export const normalize = text =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();

export function offsetLabel(value) {
  const absolute = Math.abs(value);
  return 'UTC' +
    (value < 0 ? '−' : '+') +
    String(Math.floor(absolute / 60)).padStart(2, '0') +
    ':' +
    String(absolute % 60).padStart(2, '0');
}

// A városadatok ellenőrzése és az órák ugyanazt a cache-t használják.
const formatters = new Map();
const unsupportedZones = new Set();

function getFormatter(zone) {
  if (unsupportedZones.has(zone)) {
    throw new RangeError('Nem támogatott időzóna');
  }

  if (!formatters.has(zone)) {
    try {
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
      });
      formatters.set(zone, formatter);
    } catch (error) {
      if (error instanceof RangeError) unsupportedZones.add(zone);
      throw error;
    }
  }

  return formatters.get(zone);
}

export function isSupportedZone(zone) {
  if (typeof zone !== 'string' || !zone.trim()) return false;
  try {
    getFormatter(zone);
    return true;
  } catch {
    return false;
  }
}

export function clockParts(now, clock, hour12 = false) {
  const zone = clock.zone || 'UTC';
  const time = now + (clock.zone ? 0 : clock.offset * 60000);

  const parts = Object.fromEntries(
    getFormatter(zone).formatToParts(time).map(p => [p.type, p.value])
  );

  const hour = Number(parts.hour);
  const offset = clock.zone
    ? Math.round((
        Date.UTC(
          +parts.year, +parts.month - 1, +parts.day,
          hour, +parts.minute, +parts.second
        ) - Math.floor(now / 1000) * 1000
      ) / 60000)
    : clock.offset;

  return {
    time: [
      String(hour12 ? hour % 12 || 12 : hour).padStart(2, '0'),
      parts.minute,
      parts.second
    ].join(':'),
    period: hour12 ? (hour < 12 ? 'AM' : 'PM') : '',
    date: `${parts.year}. ${parts.month}. ${parts.day}.`,
    offset
  };
}

export function parseServer(data) {
  if (
    !data ||
    typeof data !== 'object' ||
    data.timeZone !== 'UTC' ||
    typeof data.dateTime !== 'string'
  ) {
    throw new Error('Hibás UTC-válasz');
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?$/
    .exec(data.dateTime);

  if (!match) throw new Error('Hibás UTC-időformátum');

  const [, year, month, day, hour, minute, second, fraction = ''] = match;
  const values = [year, month, day, hour, minute, second].map(Number);
  const [y, mo, d, h, mi, s] = values;
  const milliseconds = Number(fraction.padEnd(3, '0').slice(0, 3));

  const epoch = Date.UTC(y, mo - 1, d, h, mi, s, milliseconds);
  const date = new Date(epoch);

  if (
    !Number.isFinite(epoch) ||
    epoch < Date.UTC(2020, 0, 1) ||
    epoch > Date.UTC(2100, 0, 1) ||
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== mo - 1 ||
    date.getUTCDate() !== d ||
    date.getUTCHours() !== h ||
    date.getUTCMinutes() !== mi ||
    date.getUTCSeconds() !== s
  ) {
    throw new Error('Érvénytelen idő');
  }

  return epoch;
}

export class TimeSource {
  constructor(wall = Date.now, mono = () => performance.now()) {
    this.wall = wall;
    this.mono = mono;
    this.last = null;
    this.reset();
  }

  reset() {
    const wall = this.wall();
    this.base = wall;
    this.start = this.mono();
    this.wallStart = wall;
    this.synced = false;
  }

  now() {
    const elapsed = this.mono() - this.start;

    // Rendszeróra-változás vagy alvás utáni eltérés esetén
    // új szinkronizálásig a készülék idejét használjuk.
    if (
      elapsed < 0 ||
      Math.abs(this.wall() - this.wallStart - elapsed) > 2000 ||
      elapsed > 3600000
    ) {
      this.reset();
    }

    return this.base + this.mono() - this.start;
  }

  accept(epoch, latency) {
    if (
      !Number.isFinite(epoch) ||
      !Number.isFinite(latency) ||
      latency < 0 ||
      latency > 4000
    ) {
      throw new Error('Érvénytelen szinkronizálási adat');
    }

    this.base = epoch + latency / 2;
    this.start = this.mono();
    this.wallStart = this.wall();
    this.synced = true;
    this.last = this.base;
  }
}