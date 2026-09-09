import { initialSettings, settingsContentSchema, storedSettingsContentSchema, type RoomDefaultsConfig, type SettingsContent } from "./calculator-defaults";

type Statement = {
  bind(...values: (string | number)[]): Statement;
  first<T>(): Promise<T | null>;
};
export type SettingsDatabase = { prepare(sql: string): Statement };
type StoredSettings = { payload: string; revision: number; updated_at: string };

export async function readRoomDefaults(db: SettingsDatabase): Promise<RoomDefaultsConfig> {
  const record = await db.prepare("SELECT payload, revision, updated_at FROM calculator_settings WHERE id = ?")
    .bind("rooms").first<StoredSettings>();
  if (!record) return initialSettings();
  return {
    ...storedSettingsContentSchema.parse(JSON.parse(record.payload)),
    revision: record.revision,
    updatedAt: record.updated_at,
  };
}

export async function saveRoomDefaults(
  db: SettingsDatabase,
  content: SettingsContent,
  expectedRevision: number,
  editorId: string,
): Promise<RoomDefaultsConfig | null> {
  const validContent = settingsContentSchema.parse(content);
  const payload = JSON.stringify(validContent);
  const updatedAt = new Date().toISOString();
  const result = expectedRevision === 0
    ? await db.prepare(`INSERT INTO calculator_settings (id, payload, revision, updated_at, updated_by)
        VALUES (?, ?, 1, ?, ?) ON CONFLICT(id) DO NOTHING RETURNING revision`)
      .bind("rooms", payload, updatedAt, editorId).first<{ revision: number }>()
    : await db.prepare(`UPDATE calculator_settings
        SET payload = ?, revision = revision + 1, updated_at = ?, updated_by = ?
        WHERE id = ? AND revision = ? RETURNING revision`)
      .bind(payload, updatedAt, editorId, "rooms", expectedRevision).first<{ revision: number }>();
  if (!result) return null;
  return { ...validContent, revision: result.revision, updatedAt };
}
