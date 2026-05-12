# Authentication System Implementation

## ✅ Completed Features

### Backend (Rust/Tauri)

- ✅ **JWT Token Generation** - Access tokens (15min) + Refresh tokens (7 days)
- ✅ **Password Hashing** - Bcrypt with cost factor 12
- ✅ **User Database** - SQLite users table with full CRUD
- ✅ **Login Endpoint** - Validates credentials, returns JWT tokens
- ✅ **Token Refresh** - Automatic token refresh with validation
- ✅ **Default Admin User** - Auto-created on first run (admin/admin123)
- ✅ **User Management** - Create, read, update, list users
- ✅ **Password Change** - Secure password update with verification

### Frontend (React/TypeScript)

- ✅ **Auth Service** - Singleton service wrapping Tauri commands
- ✅ **Token Storage** - Secure localStorage management
- ✅ **Auto Token Refresh** - Refreshes 1 minute before expiry
- ✅ **useAuth Hook** - Custom hook for component state
- ✅ **Login Component** - Modern UI with error handling
- ✅ **Protected Routes** - ProtectedRoute wrapper component
- ✅ **Session Persistence** - Tokens survive page refresh
- ✅ **Auto Logout** - On token expiry or verification failure

## 🔐 Security Features

1. **JWT-based Authentication** - Stateless, scalable auth
2. **Bcrypt Password Hashing** - Industry standard, resistant to brute force
3. **Token Expiry** - Access tokens expire in 15 minutes
4. **Auto-Refresh** - Transparent token refresh before expiry
5. **Role-Based Access** - Support for admin/operator/viewer roles
6. **Secure Storage** - Tokens in localStorage, can be enhanced to sessionStorage

## 📝 Usage Guide

### Basic Login Flow

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuth();

  const handleLogin = async () => {
    try {
      await login('admin', 'admin123');
      // User is now authenticated
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.name}!</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </>
  );
}
```

### Protect Routes with RBAC

```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';

function AdminPanel() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div>Admin Content</div>
    </ProtectedRoute>
  );
}
```

### Access Current User

```typescript
import { authService } from "@/services/auth";

const currentUser = authService.getCurrentUser();
const accessToken = authService.getAccessToken();
```

### Refresh Token Manually

```typescript
import { authService } from "@/services/auth";

try {
  const response = await authService.refreshToken();
  console.log("New access token:", response.access_token);
} catch (error) {
  // User will be logged out automatically
  console.error("Refresh failed:", error);
}
```

## 🔄 Token Flow

```
1. User submits login → Tauri backend validates password
   ↓
2. Backend generates JWT tokens (access + refresh)
   ↓
3. Tokens stored in localStorage
   ↓
4. Frontend schedules refresh 1 min before expiry
   ↓
5. Auto-refresh happens silently in background
   ↓
6. If refresh fails → Auto logout, redirect to login
```

## 📊 Default Credentials

```
Username: admin
Password: admin123
Role: admin
```

**⚠️ Change in production!** Modify in `src-tauri/src/auth.rs` in `init_default_user()` function.

## 🎯 User Management API

### List all users (Admin)

```typescript
const users = await authService.listUsers();
```

### Get specific user

```typescript
const user = await authService.getUser("user-id");
```

### Create new user (Admin)

```typescript
const newUser = await authService.createUser(
  "john_doe", // username
  "SecurePass123", // password
  "John Doe", // name
  "operator", // role: admin | operator | viewer
);
```

### Update user (Admin)

```typescript
const updated = await authService.updateUser(
  "user-id",
  "John Updated",
  "admin",
  true, // isActive
);
```

### Change password

```typescript
await authService.changePassword("user-id", "currentPassword", "newPassword");
```

## 🔗 Tauri Commands Available

All commands are pre-registered in `src-tauri/src/main.rs`:

| Command                | Purpose              |
| ---------------------- | -------------------- |
| `login`                | Authenticate user    |
| `refresh_access_token` | Get new access token |
| `verify_access_token`  | Validate token       |
| `get_user`             | Fetch user by ID     |
| `list_users`           | List all users       |
| `create_user`          | Create new user      |
| `update_user`          | Update user info     |
| `change_password`      | Change user password |

## 🚀 What's Next?

### Priority 2 (Core Features)

- [ ] Password reset/forgot password flow
- [ ] User admin panel UI
- [ ] Session management (view active sessions)
- [ ] Login history audit log
- [ ] 2FA/MFA support
- [ ] API authentication middleware
- [ ] Request signing with access token

### Priority 3 (Polish)

- [ ] Session timeout with warning
- [ ] "Remember Me" for 30 days
- [ ] Social login integration
- [ ] OAuth/OIDC support
- [ ] Rate limiting on login attempts
- [ ] Account lockout on multiple failed attempts

## 🐛 Troubleshooting

### "Token verification failed"

- Token may be expired
- Check localStorage for token_expiry_key
- Try refreshing manually or login again

### "Invalid username or password"

- Check credentials are correct
- Verify user exists and is active
- Look in SQLite users table

### Auto logout happening unexpectedly

- Check if refresh token is valid
- Verify system time is correct
- Check browser console for errors

## 📄 File Structure

```
src/
├── services/
│   └── auth.ts              # Auth service (Tauri wrapper)
├── hooks/
│   └── useAuth.ts           # useAuth hook
├── components/
│   └── ProtectedRoute.tsx   # Route protection component
├── pages/
│   └── Login.tsx            # Login UI
└── stores/
    └── useAppStore.ts       # Updated with auth integration

src-tauri/
├── src/
│   ├── auth.rs              # Rust auth logic
│   ├── main.rs              # Tauri commands registration
│   └── db.rs                # Users table in schema
└── Cargo.toml               # JWT + Bcrypt deps
```

## 🔐 Environment Variables

For production, set these in environment or config file:

```env
JWT_SECRET=your-super-secret-key-here
BCRYPT_COST=12
```

**Note:** Currently `JWT_SECRET` is hardcoded in `auth.rs`. Change before production!

---

**Ready to test?** Run `npm run desktop:dev` and try logging in with `admin/admin123`.
