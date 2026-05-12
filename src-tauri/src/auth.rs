use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// JWT Secret Key - In production, load from environment or secure config
const JWT_SECRET: &str = "fruit-market-erp-secret-key-change-in-production";

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
pub struct AuthResponse {
    pub user_id: String,
    pub username: String,
    pub role: String,
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    pub name: String,
    pub role: String,
    pub is_active: bool,
}

fn get_db_connection() -> Result<Connection, String> {
    let base_dir = dirs::data_dir().ok_or_else(|| "unable to locate application data directory".to_string())?;
    let app_dir = base_dir.join("Fruit Market ERP");
    let db_path = app_dir.join("fruit-market-erp.sqlite");
    Connection::open(db_path).map_err(|e| e.to_string())
}

/// Initialize default admin user if no users exist
pub fn init_default_user() -> Result<(), String> {
    let conn = get_db_connection()?;
    
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    if count == 0 {
        let admin_id = Uuid::new_v4().to_string();
        let password_hash = bcrypt::hash("admin123", 12).map_err(|e| e.to_string())?;
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO users (id, username, name, role, password_hash, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 1, ?, ?)",
            params![admin_id, "admin", "Administrator", "admin", password_hash, now, now],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
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

    let secret = EncodingKey::from_secret(JWT_SECRET.as_bytes());
    encode(&Header::default(), &claims, &secret).map_err(|e| e.to_string())
}

/// Generate JWT refresh token (7 days expiry)
pub fn generate_refresh_token(user_id: &str, username: &str, role: &str) -> Result<String, String> {
    let now = Utc::now();
    let expires_at = now + Duration::days(7);

    let claims = Claims {
        sub: user_id.to_string(),
        username: username.to_string(),
        role: role.to_string(),
        iat: now.timestamp(),
        exp: expires_at.timestamp(),
        token_type: "refresh".to_string(),
    };

    let secret = EncodingKey::from_secret(JWT_SECRET.as_bytes());
    encode(&Header::default(), &claims, &secret).map_err(|e| e.to_string())
}

/// Verify and decode JWT token
pub fn verify_token(token: &str) -> Result<Claims, String> {
    let secret = DecodingKey::from_secret(JWT_SECRET.as_bytes());
    decode::<Claims>(token, &secret, &Validation::default())
        .map(|data| data.claims)
        .map_err(|e| format!("Token verification failed: {}", e))
}

/// Login user with username and password
#[tauri::command]
pub fn login(request: LoginRequest) -> Result<AuthResponse, String> {
    init_default_user()?;
    
    let conn = get_db_connection()?;

    let (user_id, _name, role, password_hash): (String, String, String, String) = conn
        .query_row(
            "SELECT id, name, role, password_hash FROM users WHERE username = ? AND is_active = 1",
            params![&request.username],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                ))
            },
        )
        .optional()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Invalid username or password".to_string())?;

    // Verify password
    bcrypt::verify(&request.password, &password_hash)
        .map_err(|e| e.to_string())
        .and_then(|valid| {
            if !valid {
                Err("Invalid username or password".to_string())
            } else {
                Ok(())
            }
        })?;

    // Generate tokens
    let access_token = generate_access_token(&user_id, &request.username, &role)?;
    let refresh_token = generate_refresh_token(&user_id, &request.username, &role)?;

    Ok(AuthResponse {
        user_id,
        username: request.username,
        role,
        access_token,
        refresh_token,
        expires_in: 900, // 15 minutes in seconds
    })
}

/// Refresh access token using refresh token
#[tauri::command]
pub fn refresh_access_token(refresh_token: String) -> Result<AuthResponse, String> {
    // Verify refresh token
    let claims = verify_token(&refresh_token)?;

    if claims.token_type != "refresh" {
        return Err("Invalid token type".to_string());
    }

    // Generate new access token
    let access_token = generate_access_token(&claims.sub, &claims.username, &claims.role)?;

    Ok(AuthResponse {
        user_id: claims.sub,
        username: claims.username,
        role: claims.role,
        access_token,
        refresh_token, // Return same refresh token
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

    Ok(User {
        id: claims.sub,
        username: claims.username.clone(),
        name: claims.username, // Could fetch from DB if needed
        role: claims.role,
        is_active: true,
    })
}

/// Get user by ID
#[tauri::command]
pub fn get_user(user_id: String) -> Result<User, String> {
    let conn = get_db_connection()?;

    let user: (String, String, String, String, i64) = conn
        .query_row(
            "SELECT id, username, name, role, is_active FROM users WHERE id = ?",
            params![user_id],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                ))
            },
        )
        .optional()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "User not found".to_string())?;

    Ok(User {
        id: user.0,
        username: user.1,
        name: user.2,
        role: user.3,
        is_active: user.4 != 0,
    })
}

/// List all users (admin only)
#[tauri::command]
pub fn list_users() -> Result<Vec<User>, String> {
    let conn = get_db_connection()?;
    let mut stmt = conn
        .prepare("SELECT id, username, name, role, is_active FROM users ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let users = stmt
        .query_map([], |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                name: row.get(2)?,
                role: row.get(3)?,
                is_active: row.get::<_, i64>(4)? != 0,
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
    username: String,
    password: String,
    name: String,
    role: String,
) -> Result<User, String> {
    let conn = get_db_connection()?;
    let user_id = Uuid::new_v4().to_string();
    let password_hash = bcrypt::hash(&password, 12).map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO users (id, username, name, role, password_hash, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)",
        params![user_id, username, name, role, password_hash, now, now],
    )
    .map_err(|e| e.to_string())?;

    get_user(user_id)
}

/// Update user
#[tauri::command]
pub fn update_user(user_id: String, name: String, role: String, is_active: bool) -> Result<User, String> {
    let conn = get_db_connection()?;
    let now = Utc::now().to_rfc3339();
    let is_active_int = if is_active { 1 } else { 0 };

    conn.execute(
        "UPDATE users SET name = ?, role = ?, is_active = ?, updated_at = ? WHERE id = ?",
        params![name, role, is_active_int, now, user_id],
    )
    .map_err(|e| e.to_string())?;

    get_user(user_id)
}

/// Change user password
#[tauri::command]
pub fn change_password(user_id: String, old_password: String, new_password: String) -> Result<(), String> {
    let conn = get_db_connection()?;
    
    let password_hash: String = conn
        .query_row(
            "SELECT password_hash FROM users WHERE id = ?",
            params![user_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // Verify old password
    bcrypt::verify(&old_password, &password_hash)
        .map_err(|e| e.to_string())
        .and_then(|valid| {
            if !valid {
                Err("Invalid current password".to_string())
            } else {
                Ok(())
            }
        })?;

    let new_hash = bcrypt::hash(&new_password, 12).map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
        params![new_hash, now, user_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
