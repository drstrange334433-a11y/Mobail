/**
 * Paracha Mobile Shop — Supabase Error Formatter
 * Translates PostgreSQL RLS and constraint errors into helpful user messages
 */

export function formatSupabaseError(error: unknown, fallbackMessage = 'An unexpected error occurred.'): string {
  if (!error) return fallbackMessage;

  const rawMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
    ? error 
    : (error as { message?: string }).message || fallbackMessage;

  const lower = rawMessage.toLowerCase();

  // RLS / Permission Errors
  if (
    lower.includes('row-level security') ||
    lower.includes('violates row-level security policy') ||
    lower.includes('insufficient_privilege') ||
    lower.includes('permission denied')
  ) {
    return 'Permission denied: You do not have administrator permissions to perform this operation.';
  }

  // Constraint Errors
  if (lower.includes('check constraint') || lower.includes('check_violation')) {
    if (lower.includes('price')) {
      return 'Constraint violation: Price must be >= 0 and sale price must be less than regular price.';
    }
    if (lower.includes('rating')) {
      return 'Constraint violation: Rating must be an integer between 1 and 5.';
    }
    if (lower.includes('stock_qty') || lower.includes('quantity')) {
      return 'Constraint violation: Quantity must be non-negative.';
    }
    if (lower.includes('sort_order')) {
      return 'Constraint violation: Sort order must be greater than or equal to 0.';
    }
    return `Validation error: The submitted data violates database constraints (${rawMessage}).`;
  }

  // Unique / Duplicate Key Errors
  if (lower.includes('unique constraint') || lower.includes('duplicate key') || lower.includes('already exists')) {
    return 'Conflict error: A record with this unique identifier or slug already exists in the database.';
  }

  // Foreign Key Errors
  if (lower.includes('foreign key constraint') || lower.includes('violates foreign key')) {
    return 'Relationship error: Cannot complete operation because dependent records are linked to this item.';
  }

  return rawMessage;
}
