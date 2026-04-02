import { createClient } from '@libsql/client';

const client = createClient({ url: 'file:./data/progress.db' });

await client.execute('CREATE TABLE IF NOT EXISTS entry_groups (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name TEXT NOT NULL, position INTEGER DEFAULT 0 NOT NULL, color TEXT)');
try { await client.execute('ALTER TABLE entries ADD COLUMN group_id INTEGER REFERENCES entry_groups(id)'); } catch {}
await client.execute({ sql: "INSERT INTO entry_groups (name, position) VALUES (?, ?), (?, ?), (?, ?)", args: ['Active', 0, 'Paused', 1, 'Not Moving Forward', 2] });
console.log('Done');
process.exit(0);
