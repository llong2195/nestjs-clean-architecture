# TypeORM Metadata Bug Fix

**Date**: 2025-11-11  
**Issue**: Server startup failed with TypeORM metadata error  
**Status**: ✅ RESOLVED

## Problem

When starting the development server with `pnpm start:dev`, the application crashed with:

```
DataTypeNotSupportedError: Data type "Object" in "UserOrmEntity.password" is not supported by "postgres" database.
```

## Root Cause

TypeScript's reflection metadata (`emitDecoratorMetadata: true`) has a limitation when handling union types like `string | null`. When the TypeScript compiler emits metadata for properties with union types, it falls back to `Object` type instead of the actual type.

### Example of the Problem

**Source Code (user.orm-entity.ts)**:

```typescript
@Column({ name: 'password', nullable: true, length: 255 })
password!: string | null;  // TypeScript type: string | null
```

**Compiled JavaScript (dist/modules/user/infrastructure/persistence/user.orm-entity.js)**:

```javascript
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'password', nullable: true, length: 255 }),
    __metadata('design:type', Object), // ❌ WRONG: Should be String
  ],
  UserOrmEntity.prototype,
  'password',
  void 0,
);
```

TypeORM reads the `design:type` metadata and sees `Object` instead of `String`, causing validation to fail.

## Solution

Explicitly specify the `type` parameter in the `@Column` decorator to override TypeScript's reflection metadata:

### Before (Broken):

```typescript
@Column({ name: 'password', nullable: true, length: 255 })
password!: string | null;
```

### After (Fixed):

```typescript
@Column({ name: 'password', type: 'varchar', nullable: true, length: 255 })
password!: string | null;
```

By adding `type: 'varchar'`, TypeORM no longer relies on TypeScript's reflection metadata and uses the explicitly specified type instead.

## Files Modified

### c:\Users\llong\Desktop\clean-architecture\src\modules\user\infrastructure\persistence\user.orm-entity.ts

**Line 18**: Added `type: 'varchar'` to password column:

```typescript
@Column({ name: 'password', type: 'varchar', nullable: true, length: 255 })
password!: string | null;
```

## Verification

All other ORM entities were audited and confirmed to already have explicit `type` parameters for nullable columns:

✅ **post.orm-entity.ts** - Line 35:

```typescript
@Column({ name: 'published_at', type: 'timestamp', nullable: true })
```

✅ **session.orm-entity.ts** - Lines 38, 41:

```typescript
@Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
@Column({ name: 'user_agent', type: 'text', nullable: true })
```

✅ **user.orm-entity.ts** - Line 39 (DeleteDateColumn):

```typescript
@DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
```

✅ **post.orm-entity.ts** - Line 47 (DeleteDateColumn):

```typescript
@DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
```

## Testing

After the fix:

1. ✅ **Clean Build**:

   ```bash
   rm -rf dist && pnpm build
   ```

   Result: 0 errors

2. ✅ **Server Startup**:

   ```bash
   pnpm start:dev
   ```

   Result: Server started successfully at http://localhost:3000

3. ✅ **Database Migrations**:

   ```bash
   pnpm migration:run
   ```

   Result: All 3 migrations executed successfully
   - CreateUsersTable1731315000000 ✅
   - CreatePostTables1731316000000 ✅
   - CreateSessionsTable1731320000000 ✅

4. ✅ **Swagger UI**: Accessible at http://localhost:3000/api/docs

## Lessons Learned

### Best Practice for TypeORM with TypeScript

**Always explicitly specify the `type` parameter in `@Column` decorators when using nullable fields:**

```typescript
// ❌ BAD: Relies on TypeScript reflection metadata (fails with union types)
@Column({ nullable: true })
password?: string;

// ✅ GOOD: Explicit type specification
@Column({ type: 'varchar', nullable: true, length: 255 })
password!: string | null;
```

### When to Use Explicit Types

1. **Always** for nullable columns: `string | null`, `number | null`, etc.
2. **Always** for optional properties: `password?: string`
3. **Always** for custom TypeScript types that don't map directly to database types
4. **Optional** for non-nullable primitive types (TypeScript reflection works correctly)

### TypeORM Type Mappings

Common PostgreSQL types to specify:

| TypeScript Type   | TypeORM `type` Parameter          |
| ----------------- | --------------------------------- |
| `string \| null`  | `'varchar'`, `'text'`, `'char'`   |
| `number \| null`  | `'int'`, `'bigint'`, `'decimal'`  |
| `boolean \| null` | `'boolean'`                       |
| `Date \| null`    | `'timestamp'`, `'date'`, `'time'` |
| `Buffer \| null`  | `'bytea'`                         |
| `object \| null`  | `'json'`, `'jsonb'`               |

## References

- TypeScript Issue: [emitDecoratorMetadata with union types](https://github.com/microsoft/TypeScript/issues/17572)
- TypeORM Documentation: [Column Options](https://typeorm.io/entities#column-options)
- TypeORM Issue: [Union types in columns](https://github.com/typeorm/typeorm/issues/380)

---

**Fix Applied**: 2025-11-11 22:50 UTC  
**Status**: Production-ready ✅  
**Impact**: Zero downtime - backward compatible change
