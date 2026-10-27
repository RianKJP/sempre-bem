import * as SQLite from "expo-sqlite";

import type {
    AuthenticatedAccount,
    AuthProfile,
} from "@/features/autenticacao/service/auth_service";

type SessionRow = {
    email: string;
    name: string;
    profile: AuthProfile;
    user_id: string;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

function openSessionDatabase() {
    databasePromise ??= (async () => {
        const database = await SQLite.openDatabaseAsync("sempre_bem_session.db");

        await database.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS authenticated_sessions (
                profile TEXT PRIMARY KEY NOT NULL,
                user_id TEXT NOT NULL,
                email TEXT NOT NULL,
                name TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        `);

        return database;
    })().catch((error) => {
        databasePromise = undefined;
        throw error;
    });

    return databasePromise;
}

export async function saveAuthenticatedAccount(account: AuthenticatedAccount) {
    const database = await openSessionDatabase();

    await database.runAsync(
        `INSERT INTO authenticated_sessions (profile, user_id, email, name, updated_at)
         VALUES ($profile, $userId, $email, $name, $updatedAt)
         ON CONFLICT(profile) DO UPDATE SET
             user_id = excluded.user_id,
             email = excluded.email,
             name = excluded.name,
             updated_at = excluded.updated_at`,
        {
            $profile: account.profile,
            $userId: account.userId,
            $email: account.email,
            $name: account.name,
            $updatedAt: new Date().toISOString(),
        },
    );
}

export async function getAuthenticatedAccount(
    profile: AuthProfile,
): Promise<AuthenticatedAccount | null> {
    const database = await openSessionDatabase();
    const row = await database.getFirstAsync<SessionRow>(
        `SELECT profile, user_id, email, name
         FROM authenticated_sessions
         WHERE profile = ?`,
        profile,
    );

    if (!row?.user_id || row.profile !== profile) {
        return null;
    }

    return {
        email: row.email,
        name: row.name,
        profile: row.profile,
        userId: row.user_id,
    };
}

export async function clearAuthenticatedAccount(profile: AuthProfile) {
    const database = await openSessionDatabase();
    await database.runAsync(
        "DELETE FROM authenticated_sessions WHERE profile = ?",
        profile,
    );
}
