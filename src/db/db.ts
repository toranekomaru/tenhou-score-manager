import Dexie, { type EntityTable } from 'dexie';
import { GameRecord, Settings } from '../types';

export const db = new Dexie('TenhouManagerDB') as Dexie & {
  gameRecords: EntityTable<GameRecord, 'id'>;
  settings: EntityTable<Settings, 'id'>;
};

db.version(1).stores({
  gameRecords: '++id, date, startDan, room, rule',
  settings: 'id'
});

export async function initializeSettings() {
  const existing = await db.settings.get(1);
  if (!existing) {
    await db.settings.add({
      id: 1,
      currentDan: "4段",
      currentPoint: 800,
      currentRating: 1800,
      ratingDeltas: {
        1: 6,
        2: 2,
        3: -2,
        4: -6
      }
    });
  } else if (!existing.ratingDeltas) {
    await db.settings.update(1, {
      ratingDeltas: {
        1: 6,
        2: 2,
        3: -2,
        4: -6
      }
    });
  }
}
