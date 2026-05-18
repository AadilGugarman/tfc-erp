use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use argon2::Argon2;
use bcrypt;
use password_hash::{
    rand_core::OsRng,
    PasswordHash, PasswordHasher, PasswordVerifier, SaltString
};
use std::fs;
use std::io::Write;
use rand::RngCore;
use hmac::{Hmac, Mac};
use sha2::Sha256;

fn get_jwt_secret() -> Vec<u8> {
    let base_dir = dirs::data_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
    let app_dir = base_dir.join("Fruit Market ERP");
    let secret_path = app_dir.join(".jwt_secret");

    if let Ok(secret) = fs::read(&secret_path) {
        if secret.len() >= 32 {
            return secret;
        }
    }

    // Generate a new secure random secret if not found or invalid
    let mut new_secret = [0u8; 64];
    rand::thread_rng().fill_bytes(&mut new_secret);

    if let Err(e) = fs::create_dir_all(&app_dir) {
        eprintln!("[Auth] Failed to create app directory for JWT secret: {}", e);
    }

    match fs::File::create(&secret_path) {
        Ok(mut file) => {
            if let Err(e) = file.write_all(&new_secret) {
                eprintln!("[Auth] Failed to write JWT secret to file: {}", e);
            }
        }
        Err(e) => {
            eprintln!("[Auth] Failed to create JWT secret file: {}", e);
        }
    }

    new_secret.to_vec()
}

// ─── Refresh token DB helpers ─────────────────────────────────────────────────

/// Ensure the refresh_tokens table exists (called from init_database).
pub fn ensure_refresh_tokens_table(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS refresh_tokens (
            id          TEXT PRIMARY KEY,
            user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash  TEXT NOT NULL UNIQUE,
            expires_at  TEXT NOT NULL,
            created_at  TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_rt_user ON refresh_tokens(user_id);
        CREATE INDEX IF NOT EXISTS idx_rt_hash ON refresh_tokens(token_hash);",
    )
    .map_err(|e| e.to_string())
}

/// Hash a refresh token for safe DB storage using HMAC-SHA256 with the app's JWT secret.
/// This is deterministic (same input → same output) so we can look it up,
/// but one-way so a DB leak doesn't expose the raw token.
fn hash_refresh_token(token: &str) -> String {
    type HmacSha256 = Hmac<Sha256>;
    let secret = get_jwt_secret();
    let mut mac = HmacSha256::new_from_slice(&secret)
        .expect("HMAC accepts any key length");
    mac.update(token.as_bytes());
    let result = mac.finalize().into_bytes();
    result.iter().map(|b| format!("{:02x}", b)).collect()
}

/// Store a new refresh token in the database.
fn store_refresh_token(conn: &Connection, user_id: &str, token: &str, expires_at: &str) -> Result<(), String> {
    let id = Uuid::new_v4().to_string();
    let token_hash = hash_refresh_token(token);
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, user_id, token_hash, expires_at, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Revoke a specific refresh token (used on rotation and logout).
fn revoke_refresh_token(conn: &Connection, token: &str) -> Result<(), String> {
    let token_hash = hash_refresh_token(token);
    conn.execute(
        "DELETE FROM refresh_tokens WHERE token_hash = ?1",
        params![token_hash],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Revoke ALL refresh tokens for a user (used on logout).
fn revoke_all_user_tokens(conn: &Connection, user_id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM refresh_tokens WHERE user_id = ?1",
        params![user_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Validate that a refresh token exists in the DB and is not expired.
fn validate_refresh_token_in_db(conn: &Connection, token: &str) -> Result<String, String> {
    let token_hash = hash_refresh_token(token);
    let now = Utc::now().to_rfc3339();
    let result: Option<(String, String)> = conn
        .query_row(
            "SELECT user_id, expires_at FROM refresh_tokens WHERE token_hash = ?1",
            params![token_hash],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    match result {
        None => Err("Refresh token not found or already revoked".to_string()),
        Some((user_id, expires_at)) => {
            if expires_at < now {
                // Clean up expired token
                let _ = conn.execute(
                    "DELETE FROM refresh_tokens WHERE token_hash = ?1",
                    params![token_hash],
                );
                Err("Refresh token has expired".to_string())
            } else {
                Ok(user_id)
            }
        }
    }
}

/// Purge expired refresh tokens (housekeeping, called periodically).
pub fn purge_expired_refresh_tokens(conn: &Connection) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "DELETE FROM refresh_tokens WHERE expires_at < ?1",
        params![now],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn verify_any_password(password: &str, stored_hash: &str) -> Result<bool, String> {
    // Check if it's a bcrypt hash (usually starts with $2a$, $2b$, or $2y$)
    if stored_hash.starts_with("$2a$") || stored_hash.starts_with("$2b$") || stored_hash.starts_with("$2y$") {
        return bcrypt::verify(password, stored_hash).map_err(|e| e.to_string());
    }

    // Otherwise assume Argon2
    let parsed_hash = PasswordHash::new(stored_hash).map_err(|e| e.to_string())?;
    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,           // user ID
    pub username: String,      // username
    pub role: String,          // user role
    pub exp: i64,              // expiration time
    pub iat: i64,              // issued at
    pub token_type: String,    // "access" or "refresh"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshAccessTokenRequest {
    #[serde(alias = "refreshToken")]
    pub refresh_token: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LogoutRequest {
    #[serde(alias = "refreshToken")]
    pub refresh_token: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub user_id: String,
    pub username: String,
    pub email: String,
    pub name: String,
    pub role: String,
    pub company_ids: Vec<String>,
    pub default_company_id: Option<String>,
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    pub name: String,
    pub email: String,
    pub role: String,
    pub company_ids: Vec<String>,
    pub default_company_id: Option<String>,
    pub is_active: bool,
}

fn get_db_connection() -> Result<Connection, String> {
    crate::db::open_connection()
}

/// Generate JWT access token (15 minutes expiry)
pub fn generate_access_token(user_id: &str, username: &str, role: &str) -> Result<String, String> {
    let now = Utc::now();
    let expires_at = now + Duration::minutes(15);

    let claims = Claims {
        sub: user_id.to_string(),
        username: username.to_string(),
        role: role.to_string(),
        iat: now.timestamp(),
        exp: expires_at.timestamp(),
        token_type: "access".to_string(),
    };

    let secret_bytes = get_jwt_secret();
    let secret = EncodingKey::from_secret(&secret_bytes);
    encode(&Header::default(), &claims, &secret).map_err(|e| e.to_string())
}

/// Generate JWT refresh token (30 days expiry)
pub fn generate_refresh_token(user_id: &str, username: &str, role: &str) -> Result<String, String> {
    let now = Utc::now();
    let expires_at = now + Duration::days(30);

    let claims = Claims {
        sub: user_id.to_string(),
        username: username.to_string(),
        role: role.to_string(),
        iat: now.timestamp(),
        exp: expires_at.timestamp(),
        token_type: "refresh".to_string(),
    };

    let secret_bytes = get_jwt_secret();
    let secret = EncodingKey::from_secret(&secret_bytes);
    encode(&Header::default(), &claims, &secret).map_err(|e| e.to_string())
}

/// Verify and decode JWT token
pub fn verify_token(token: &str) -> Result<Claims, String> {
    let secret_bytes = get_jwt_secret();
    let secret = DecodingKey::from_secret(&secret_bytes);
    decode::<Claims>(token, &secret, &Validation::default())
        .map(|data| data.claims)
        .map_err(|e| format!("Unauthorized: {}", e))
}

/// Helper to validate access token and return claims
pub fn authorize(token: &str) -> Result<Claims, String> {
    let claims = verify_token(token)?;
    if claims.token_type != "access" {
        return Err("Unauthorized: Invalid token type".to_string());
    }
    Ok(claims)
}

/// Check if any user exists in the database
#[tauri::command]
pub fn has_users() -> Result<bool, String> {
    let conn = get_db_connection()?;
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    Ok(count > 0)
}

fn build_auth_response(
    user_id: &str,
    username: &str,
    name: &str,
    email: &str,
    role: &str,
    company_ids: Vec<String>,
    default_company_id: Option<String>,
) -> Result<AuthResponse, String> {
    let access_token = generate_access_token(user_id, username, role)?;
    let refresh_token = generate_refresh_token(user_id, username, role)?;

    // Store the refresh token hash in the database for server-side validation
    let conn = get_db_connection()?;
    let expires_at = (Utc::now() + Duration::days(30)).to_rfc3339();
    store_refresh_token(&conn, user_id, &refresh_token, &expires_at)?;

    Ok(AuthResponse {
        user_id: user_id.to_string(),
        username: username.to_string(),
        email: email.to_string(),
        name: name.to_string(),
        role: role.to_string(),
        company_ids,
        default_company_id,
        access_token,
        refresh_token,
        expires_in: 900, // 15 minutes
    })
}

/// Create the initial admin user
#[tauri::command]
pub fn setup_initial_admin(username: String, password: String, name: String, email: String) -> Result<AuthResponse, String> {
    let conn = get_db_connection()?;

    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    let existing_user: Option<(String, String, String, String, String, Option<String>, String)> = conn
        .query_row(
            "SELECT id, name, email, role, company_ids, default_company_id, password_hash FROM users WHERE username = ? COLLATE NOCASE AND is_active = 1",
            params![&username],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                    row.get(5)?,
                    row.get(6)?,
                ))
            },
        )
        .optional()
        .map_err(|e| e.to_string())?;

    if let Some((user_id, _, _, role, company_ids_str, default_company_id, password_hash)) = existing_user {
        if !verify_any_password(&password, &password_hash)? {
            return Err(format!(
                "Username \"{}\" is already registered. Sign in with your password, or choose a different username.",
                username
            ));
        }

        let now = Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE users SET name = ?, email = ?, updated_at = ? WHERE id = ?",
            params![name, email, now, user_id],
        )
        .map_err(|e| e.to_string())?;

        let company_ids: Vec<String> =
            serde_json::from_str(&company_ids_str).unwrap_or_default();

        return build_auth_response(
            &user_id,
            &username,
            &name,
            &email,
            &role,
            company_ids,
            default_company_id,
        );
    }

    if count > 0 {
        return Err(
            "Initial setup is already complete. Please sign in with your existing account."
                .to_string(),
        );
    }

    let admin_id = Uuid::new_v4().to_string();

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| e.to_string())?
        .to_string();

    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO users (id, username, name, email, role, company_ids, default_company_id, password_hash, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'admin', '[]', NULL, ?, 1, ?, ?)",
        params![
            admin_id,
            username,
            name,
            email,
            password_hash,
            now,
            now
        ],
    )
    .map_err(|e| {
        if e.to_string().contains("UNIQUE constraint failed: users.username") {
            format!(
                "Username \"{}\" is already registered. Sign in instead.",
                username
            )
        } else {
            e.to_string()
        }
    })?;

    build_auth_response(
        &admin_id,
        &username,
        &name,
        &email,
        "admin",
        vec![],
        None,
    )
}

/// Clear users (and dependent company data) so setup can run again.
/// Development / debug builds only — no auth token required.
#[tauri::command]
pub fn clear_users_for_setup() -> Result<(), String> {
    #[cfg(debug_assertions)]
    {
        let conn = get_db_connection()?;

        // Companies reference users (owner_id); delete companies first so CASCADE
        // clears related rows, then remove users.
        conn.execute_batch(
            "PRAGMA foreign_keys = ON;
             DELETE FROM companies;
             DELETE FROM users;",
        )
        .map_err(|e| format!("Failed to reset for setup: {}", e))?;

        let remaining: i64 = conn
            .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
            .map_err(|e| e.to_string())?;

        if remaining > 0 {
            return Err(format!(
                "Reset incomplete: {} user(s) still in database",
                remaining
            ));
        }

        Ok(())
    }
    #[cfg(not(debug_assertions))]
    {
        Err(
            "Reset is only available in development builds. Run: npm run desktop:dev"
                .to_string(),
        )
    }
}

/// Login user with username and password
#[tauri::command]
pub fn login(request: LoginRequest) -> Result<AuthResponse, String> {
    let conn = get_db_connection()?;

    let (user_id, name, email, role, company_ids_str, default_company_id, password_hash): (String, String, String, String, String, Option<String>, String) = conn
        .query_row(
            "SELECT id, name, email, role, company_ids, default_company_id, password_hash FROM users WHERE username = ? AND is_active = 1",
            params![&request.username],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                    row.get(5)?,
                    row.get(6)?,
                ))
            },
        )
        .optional()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Invalid username or password".to_string())?;

    // Verify password using legacy-aware helper
    if !verify_any_password(&request.password, &password_hash)? {
        return Err("Invalid username or password".to_string());
    }

    // Migration path: if the hash was bcrypt, rehash with Argon2
    if password_hash.starts_with("$2a$") || password_hash.starts_with("$2b$") || password_hash.starts_with("$2y$") {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        if let Ok(new_hash) = argon2.hash_password(request.password.as_bytes(), &salt) {
            let now = Utc::now().to_rfc3339();
            let _ = conn.execute(
                "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
                params![new_hash.to_string(), now, user_id],
            );
        }
    }

    // Parse company IDs from JSON
    let company_ids: Vec<String> = serde_json::from_str(&company_ids_str)
        .unwrap_or_else(|_| vec![]);

    // Use build_auth_response which stores the refresh token in the DB
    build_auth_response(
        &user_id,
        &request.username,
        &name,
        &email,
        &role,
        company_ids,
        default_company_id,
    )
}

/// Refresh access token using refresh token — with rotation.
///
/// Security guarantees:
///   1. Validates the JWT signature and expiry.
///   2. Validates the token exists in the DB (not revoked).
///   3. Verifies the user is still active in the DB.
///   4. Atomically revokes the old refresh token and issues a new one
///      (refresh token rotation — a stolen token can only be used once).
#[tauri::command]
pub fn refresh_access_token(request: RefreshAccessTokenRequest) -> Result<AuthResponse, String> {
    let refresh_token = request.refresh_token;

    // Step 1: Verify JWT signature and expiry
    let claims = verify_token(&refresh_token)?;
    if claims.token_type != "refresh" {
        return Err("Invalid token type".to_string());
    }

    let conn = get_db_connection()?;

    // Step 2: Validate token exists in DB (not revoked) and get user_id
    let db_user_id = validate_refresh_token_in_db(&conn, &refresh_token)?;

    // Sanity check: JWT sub must match DB record
    if db_user_id != claims.sub {
        // Token tampering detected — revoke everything for this user
        let _ = revoke_all_user_tokens(&conn, &claims.sub);
        return Err("Token validation failed".to_string());
    }

    // Step 3: Verify user is still active in the DB (backend validation)
    let (name, email, role, company_ids_str, default_company_id): (String, String, String, String, Option<String>) = conn
        .query_row(
            "SELECT name, email, role, company_ids, default_company_id FROM users WHERE id = ?1 AND is_active = 1",
            params![&claims.sub],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?)),
        )
        .optional()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "User not found or account disabled".to_string())?;

    // Step 4: Revoke the old refresh token (rotation — one-time use)
    revoke_refresh_token(&conn, &refresh_token)?;

    // Step 5: Issue new access token + new refresh token
    let company_ids: Vec<String> = serde_json::from_str(&company_ids_str).unwrap_or_default();
    let new_access_token = generate_access_token(&claims.sub, &claims.username, &role)?;
    let new_refresh_token = generate_refresh_token(&claims.sub, &claims.username, &role)?;

    // Step 6: Store the new refresh token in DB
    let expires_at = (Utc::now() + Duration::days(30)).to_rfc3339();
    store_refresh_token(&conn, &claims.sub, &new_refresh_token, &expires_at)?;

    // Housekeeping: purge any other expired tokens for this user
    let _ = purge_expired_refresh_tokens(&conn);

    Ok(AuthResponse {
        user_id: claims.sub,
        username: claims.username,
        email,
        name,
        role,
        company_ids,
        default_company_id,
        access_token: new_access_token,
        refresh_token: new_refresh_token, // Rotated — new token every refresh
        expires_in: 900,
    })
}

/// Verify access token (for API middleware)
#[tauri::command]
pub fn verify_access_token(token: String) -> Result<User, String> {
    let claims = verify_token(&token)?;

    if claims.token_type != "access" {
        return Err("Invalid token type".to_string());
    }

    let conn = get_db_connection()?;
    
    let (name, email, role, company_ids_str, default_company_id, is_active): (String, String, String, String, Option<String>, i64) = conn
        .query_row(
            "SELECT name, email, role, company_ids, default_company_id, is_active FROM users WHERE id = ?",
            params![&claims.sub],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                    row.get(5)?,
                ))
            },
        )
        .optional()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "User not found".to_string())?;

    // Parse company IDs from JSON
    let company_ids: Vec<String> = serde_json::from_str(&company_ids_str)
        .unwrap_or_else(|_| vec![]);

    Ok(User {
        id: claims.sub,
        username: claims.username,
        name,
        email,
        role,
        company_ids,
        default_company_id,
        is_active: is_active != 0,
    })
}

/// Logout — revokes the refresh token server-side so it cannot be reused.
/// Also purges all other expired tokens for the user as housekeeping.
#[tauri::command]
pub fn logout(request: LogoutRequest) -> Result<(), String> {
    let conn = get_db_connection()?;
    // Best-effort: revoke the specific token. If it's already gone, that's fine.
    let _ = revoke_refresh_token(&conn, &request.refresh_token);
    // Also purge any expired tokens globally
    let _ = purge_expired_refresh_tokens(&conn);
    Ok(())
}

fn get_user_internal(user_id: String) -> Result<User, String> {
    let conn = get_db_connection()?;

    let (id, username, name, email, role, company_ids_str, default_company_id, is_active): (String, String, String, String, String, String, Option<String>, i64) = conn
        .query_row(
            "SELECT id, username, name, email, role, company_ids, default_company_id, is_active FROM users WHERE id = ?",
            params![user_id],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                    row.get(5)?,
                    row.get(6)?,
                    row.get(7)?,
                ))
            },
        )
        .optional()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "User not found".to_string())?;

    // Parse company IDs from JSON
    let company_ids: Vec<String> = serde_json::from_str(&company_ids_str)
        .unwrap_or_else(|_| vec![]);

    Ok(User {
        id,
        username,
        name,
        email,
        role,
        company_ids,
        default_company_id,
        is_active: is_active != 0,
    })
}

/// Get user by ID
#[tauri::command]
pub fn get_user(token: String, user_id: String) -> Result<User, String> {
    authorize(&token)?;
    get_user_internal(user_id)
}

/// List all users (admin only)
#[tauri::command]
pub fn list_users(token: String) -> Result<Vec<User>, String> {
    authorize(&token)?;
    let conn = get_db_connection()?;
    let mut stmt = conn
        .prepare("SELECT id, username, name, email, role, company_ids, default_company_id, is_active FROM users ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let users = stmt
        .query_map([], |row| {
            let company_ids_str: String = row.get(5)?;
            let company_ids: Vec<String> = serde_json::from_str(&company_ids_str)
                .unwrap_or_else(|_| vec![]);
            
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                name: row.get(2)?,
                email: row.get(3)?,
                role: row.get(4)?,
                company_ids,
                default_company_id: row.get(6)?,
                is_active: row.get::<_, i64>(7)? != 0,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(users)
}

/// Create new user (admin only)
#[tauri::command]
pub fn create_user(
    token: String,
    username: String,
    password: String,
    name: String,
    role: String,
) -> Result<User, String> {
    authorize(&token)?;
    let conn = get_db_connection()?;
    let user_id = Uuid::new_v4().to_string();
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| e.to_string())?
        .to_string();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO users (id, username, name, role, password_hash, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)",
        params![user_id, username, name, role, password_hash, now, now],
    )
    .map_err(|e| e.to_string())?;

    get_user_internal(user_id)
}

/// Update user
#[tauri::command]
pub fn update_user(token: String, user_id: String, name: String, role: String, is_active: bool) -> Result<User, String> {
    authorize(&token)?;
    let conn = get_db_connection()?;
    let now = Utc::now().to_rfc3339();
    let is_active_int = if is_active { 1 } else { 0 };

    conn.execute(
        "UPDATE users SET name = ?, role = ?, is_active = ?, updated_at = ? WHERE id = ?",
        params![name, role, is_active_int, now, user_id],
    )
    .map_err(|e| e.to_string())?;

    get_user_internal(user_id)
}

/// Update user's accessible company IDs and default company
#[tauri::command]
pub fn update_user_companies(
    token: String,
    user_id: String,
    company_ids: Vec<String>,
    default_company_id: Option<String>,
) -> Result<User, String> {
    authorize(&token)?;
    let conn = get_db_connection()?;
    let company_ids_json = serde_json::to_string(&company_ids).map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE users SET company_ids = ?, default_company_id = ?, updated_at = ? WHERE id = ?",
        params![company_ids_json, default_company_id, now, user_id],
    )
    .map_err(|e| e.to_string())?;

    get_user_internal(user_id)
}

/// Change user password
#[tauri::command]
pub fn change_password(token: String, user_id: String, old_password: String, new_password: String) -> Result<(), String> {
    authorize(&token)?;
    let conn = get_db_connection()?;
    
    let password_hash: String = conn
        .query_row(
            "SELECT password_hash FROM users WHERE id = ?",
            params![user_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // Verify old password using legacy-aware helper
    if !verify_any_password(&old_password, &password_hash)? {
        return Err("Invalid current password".to_string());
    }

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let new_hash = argon2
        .hash_password(new_password.as_bytes(), &salt)
        .map_err(|e| e.to_string())?
        .to_string();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
        params![new_hash, now, user_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
