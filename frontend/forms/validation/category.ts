export interface CategoryValidationError {
  name?: string;
}

export function validateCategoryForm(name: string): CategoryValidationError {
  const errors: CategoryValidationError = {};
  const trimmed = name.trim();

  if (!trimmed) {
    errors.name = 'Category name is required.';
  } else if (trimmed.length > 100) {
    errors.name = 'Category name cannot exceed 100 characters.';
  }

  return errors;
}
