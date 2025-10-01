# Budget App - Autenticación con Email

## 🚀 Setup

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno

Edita `config.js` y reemplaza:

- **RESEND_API_KEY**: Tu API key de Resend (https://resend.com/api-keys)
- **JWT_SECRET**: Un secreto seguro para JWT (puedes generar uno random)
- **frontendUrl**: La URL donde corre tu frontend

### 3. Iniciar el servidor
```bash
npm start
# o para desarrollo con auto-reload:
npm run dev
```

El servidor corre en `http://localhost:3000`

## 📝 Endpoints de la API

### Autenticación

#### Registrar usuario
```
POST /api/auth/register
Body: { "email": "user@example.com", "password": "password123" }
```

#### Verificar email
```
GET /api/auth/verify/:token
```

#### Login
```
POST /api/auth/login
Body: { "email": "user@example.com", "password": "password123" }
Response: { "token": "jwt_token", "user": {...} }
```

### Budget Items (requieren autenticación)

Incluir header: `Authorization: Bearer YOUR_JWT_TOKEN`

#### Obtener todos los items
```
GET /api/budget/items
```

#### Crear item
```
POST /api/budget/items
Body: {
  "type": "Income" | "Expense",
  "date": "2025-09-30",
  "description": "Salary",
  "amount": 2000
}
```

#### Actualizar item
```
PUT /api/budget/items/:id
Body: { "type": "Income", "date": "2025-09-30", "description": "Salary", "amount": 2500 }
```

#### Eliminar item
```
DELETE /api/budget/items/:id
```

## 🔐 Configuración de Resend

1. Crea una cuenta en https://resend.com
2. Verifica tu dominio (o usa el dominio de prueba)
3. Crea una API Key
4. Pégala en `config.js`

## 📦 Estructura de la base de datos

### Collection: users
```javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  resetToken: String (temporal, para reset de contraseña),
  resetTokenExpires: Date (temporal, para reset de contraseña),
  createdAt: Date
}
```

### Collection: budgetItems
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  type: "Income" | "Expense",
  date: Date,
  description: String,
  amount: Number,
  createdAt: Date
}
```

## 🎯 Próximos pasos

1. Crear páginas de login/register en el frontend
2. Guardar el JWT token en localStorage
3. Modificar las llamadas al API para incluir el token
4. Crear página de verificación de email

