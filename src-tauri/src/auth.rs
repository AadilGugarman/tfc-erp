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

        // Create admin user first
        conn.execute(
            "INSERT INTO users (id, username, name, email, role, company_ids, default_company_id, password_hash, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)",
            params![
                admin_id,
                "admin",
                "Administrator",
                "admin@talhafruitco.com",
                "admin",
                "[]", // Empty array initially
                None::<String>, // No default company yet
                password_hash,
                now,
                now
            ],
        )
        .map_err(|e| e.to_string())?;

        // Create default companies
        let company1_id = Uuid::new_v4().to_string();
        let company2_id = Uuid::new_v4().to_string();
        
        conn.execute(
            "INSERT INTO companies (id, name, address, city, state, phone, email, gstin, invoice_prefix, language, theme, financial_year_start, financial_year_end, owner_id, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)",
            params![
                company1_id,
                "TFC Billing મુખ્ય",
                "123, આર્જે પ્લાજા",
                "અમદાવાદ",
                "ગુજરાત",
                "9876543210",
                "main@tfcbilling.com",
                "24AABCT1234F1Z5",
                "INV",
                "gujarati",
                "light",
                4, // April
                3, // March
                admin_id,
                now,
                now
            ],
        )
        .map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT INTO companies (id, name, address, city, state, phone, email, gstin, invoice_prefix, language, theme, financial_year_start, financial_year_end, owner_id, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)",
            params![
                company2_id,
                "TFC બ્રાંચ - સુરત",
                "456, કમર્શિયલ પ્લાજા",
                "સુરત",
                "ગુજરાત",
                "9988776655",
                "surat@tfcbilling.com",
                "24AABCT5678F1Z5",
                "SR",
                "gujarati",
                "light",
                4, // April
                3, // March
                admin_id,
                now,
                now
            ],
        )
        .map_err(|e| e.to_string())?;

        // Update user with company access
        let company_ids = serde_json::to_string(&vec![company1_id.clone(), company2_id.clone()])
            .map_err(|e| e.to_string())?;

        conn.execute(
            "UPDATE users SET company_ids = ?, default_company_id = ? WHERE id = ?",
            params![company_ids, company1_id, admin_id],
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

    // Parse company IDs from JSON
    let company_ids: Vec<String> = serde_json::from_str(&company_ids_str)
        .unwrap_or_else(|_| vec![]);

    // Generate tokens
    let access_token = generate_access_token(&user_id, &request.username, &role)?;
    let refresh_token = generate_refresh_token(&user_id, &request.username, &role)?;

    Ok(AuthResponse {
        user_id,
        username: request.username,
        email,
        name,
        role,
        company_ids,
        default_company_id,
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

    let conn = get_db_connection()?;
    
    let (name, email, role, company_ids_str, default_company_id): (String, String, String, String, Option<String>) = conn
        .query_row(
            "SELECT name, email, role, company_ids, default_company_id FROM users WHERE id = ? AND is_active = 1",
            params![&claims.sub],
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

    // Parse company IDs from JSON
    let company_ids: Vec<String> = serde_json::from_str(&company_ids_str)
        .unwrap_or_else(|_| vec![]);

    // Generate new access token
    let access_token = generate_access_token(&claims.sub, &claims.username, &role)?;

    Ok(AuthResponse {
        user_id: claims.sub,
        username: claims.username,
        email,
        name,
        role,
        company_ids,
        default_company_id,
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

/// Get user by ID
#[tauri::command]
pub fn get_user(user_id: String) -> Result<User, String> {
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

/// List all users (admin only)
#[tauri::command]
pub fn list_users() -> Result<Vec<User>, String> {
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
