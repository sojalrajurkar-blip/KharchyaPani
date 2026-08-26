export interface ExpenseValidationError {
  amount?: string;
  category_id?: string;
  expense_date?: string;
  note?: string;
}

export function validateExpenseForm(
  amount: string | number,
  category_id: number | string,
  expense_date: string,
  note?: string
): ExpenseValidationError {
  const errors: ExpenseValidationError = {};

  const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(numAmount)) {
    errors.amount = 'Amount must be a valid number.';
  } else if (numAmount <= 0) {
    errors.amount = 'Amount must be greater than zero.';
  }

  const catId = typeof category_id === 'number' ? category_id : parseInt(category_id, 10);
  if (!catId || isNaN(catId)) {
    errors.category_id = 'Category selection is required.';
  }

  if (!expense_date) {
    errors.expense_date = 'Date is required.';
  } else {
    const parsedDate = new Date(expense_date);
    if (isNaN(parsedDate.getTime())) {
      errors.expense_date = 'Date must be a valid date.';
    }
  }

  if (note && note.length > 500) {
    errors.note = 'Note cannot exceed 500 characters.';
  }

  return errors;
}
