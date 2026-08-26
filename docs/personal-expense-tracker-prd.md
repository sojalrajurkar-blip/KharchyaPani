# Product Requirements Document (PRD)
## Personal Expense Tracker

---

## 1. Product Overview

Personal Expense Tracker is a simple, web-based application that allows a user to record, manage, and understand their personal expenses.

The first version (MVP) focuses only on basic expense tracking — adding, viewing, editing, and deleting expenses, along with fully dynamic (user-managed) categories.

The application must be fully dynamic and database-driven. No business data — categories, expenses, totals, or summaries — should ever be hardcoded into the application.

The goal is a clean, simple MVP that can later be extended with additional financial management features (budgeting, reports, income tracking, etc.) without requiring a rebuild of the core.

**Note:** This PRD intentionally makes no technology decisions. No frontend, backend, database, framework, or hosting/deployment technology is specified or assumed anywhere in this document. Technology choices will be made separately.

---

## 2. Problem Statement

Users often spend money across many different activities but do not maintain a proper record of where their money is going. Without a simple way to log and review spending, it's difficult to answer a basic question: *"How much have I spent, and on what?"*

Personal Expense Tracker solves this by giving the user a simple, always-up-to-date way to record expenses and see their total spending.

---

## 3. Product Goal

The MVP should allow the user to:

- Add an expense
- View expenses
- Edit an expense
- Delete an expense
- Create and manage expense categories
- Filter expenses
- Calculate total expenses
- View recent expenses

All data must be stored persistently and loaded dynamically — nothing is hardcoded.

---

## 4. Target User

The initial target user is a single individual who wants to track their own personal expenses.

Multi-user functionality is **not** required in the first MVP.

---

## 5. Product Scope

**In Scope (MVP):**
- Dashboard
- Add Expense
- Edit Expense
- Delete Expense
- Expense History
- Dynamic Category Management
- Total Expense calculation
- Basic Filtering
- Persistent Data Storage

**Out of Scope (Version 1):**
- Login / Register
- Authentication
- AI features
- Payment gateway
- Notifications
- Real-time features
- Complex analytics
- Advanced budgeting
- Multi-user functionality
- Microservices
- Unnecessary third-party integrations

The first version is kept intentionally simple.

---

## 6. MVP Features

### 6.1 Expense Management
The user can create an expense with:
- Amount
- Category
- Date
- Note/Description

**Example:**
```
Amount: ₹250
Category: Food
Date: 26 August 2026
Note: Lunch
```

The user can also view, edit, and delete an expense.

### 6.2 Dynamic Category Management
Categories are **not** hardcoded — they are stored as dynamic records that the user fully manages.

The user can:
- Create a category
- View categories
- Edit a category
- Delete a category

**Example starter categories:** Food, Travel, Shopping, Bills, Health, Entertainment, Other — these are examples only. The system must never assume these are the only categories.

If the user creates a new category (e.g. "College" or "Mobile Recharge"), it must automatically become available when adding or editing an expense — with **no source-code change required**.

### 6.3 Dashboard
Dynamically displays:
- Total Expense
- Number of Expenses
- Recent Expenses
- Category-wise expense summary

### 6.4 Expense History
A list/table of all recorded expenses, with Edit and Delete actions.

### 6.5 Filtering
- Filter by category
- Filter by date
- Filter by date range

### 6.6 Total Expense
Automatically recalculated whenever an expense is added, updated, or deleted.

---

## 7. Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | User can add a new expense (amount, category, date, note) | P0 |
| FR-2 | User can view a list of all expenses | P0 |
| FR-3 | User can edit an existing expense | P0 |
| FR-4 | User can delete an expense (with confirmation) | P0 |
| FR-5 | User can create a new category | P0 |
| FR-6 | User can view all categories | P0 |
| FR-7 | User can edit a category | P0 |
| FR-8 | User can delete a category | P0 |
| FR-9 | New categories automatically appear in the Add/Edit Expense form | P0 |
| FR-10 | Dashboard shows total expense, expense count, recent expenses, and category-wise summary | P0 |
| FR-11 | User can filter expenses by category | P0 |
| FR-12 | User can filter expenses by date | P0 |
| FR-13 | User can filter expenses by date range | P0 |
| FR-14 | Total expense recalculates automatically after add/edit/delete | P0 |

---

## 8. Dynamic Data Requirements

The application must **not** hardcode:
- Categories
- Expense records
- Total expenses
- Expense counts
- Dashboard statistics
- Dropdown options
- Category summaries
- User-created data
- Business calculations

All application data must be loaded, stored, updated, and deleted dynamically.

Initial sample categories may be inserted during first-time setup, but after creation they must behave exactly like any normal user-created category (fully editable and deletable).

---

## 9. User Stories

- As a user, I want to add an expense so that I can record my spending.
- As a user, I want to edit an expense so that I can correct mistakes.
- As a user, I want to delete an expense so that incorrect records can be removed.
- As a user, I want to create categories so that I can organize my spending.
- As a user, I want to filter expenses so that I can find specific records.
- As a user, I want to see my total expenses so that I know how much I have spent.
- As a user, I want to see recent expenses so that I can quickly understand my latest spending.

---

## 10. User Flows

### 10.1 Add Expense (Primary Flow)
```
Open Application
→ Dashboard
→ Add Expense
→ Select/Create Category
→ Enter Amount
→ Select Date
→ Add Optional Note
→ Save
→ Expense appears in History
→ Dashboard statistics update
```

### 10.2 Edit Expense
```
Expense History → Select Expense → Edit → Update Fields → Save → History and Dashboard update
```

### 10.3 Delete Expense
```
Expense History → Select Expense → Delete → Confirm → Expense removed → History and Dashboard update
```

### 10.4 Create Category
```
Category Management → Add New Category → Enter Name → Save → Category available in Expense form
```

### 10.5 Edit Category
```
Category Management → Select Category → Edit → Update Name → Save
```

### 10.6 Delete Category
```
Category Management → Select Category → Delete → Confirm → Category removed
```

### 10.7 Filter Expenses
```
Expense History → Apply Filter (Category / Date / Date Range) → List updates dynamically
```

---

## 11. Application Pages

1. **Dashboard** — total expense, expense count, recent expenses, category-wise summary
2. **Add Expense** — form with amount, category (dynamic dropdown), date, note
3. **Edit Expense** — same form, pre-filled with existing values
4. **Expense History** — list/table of all expenses with filter controls and Edit/Delete actions
5. **Category Management** — create, view, edit, delete categories

The Add/Edit Expense screen must load available categories dynamically at runtime. The category list must never be permanently embedded in the UI.

---

## 12. Data Model

**Category**
| Field | Notes |
|-------|-------|
| id | Primary key |
| name | Required, unique |
| created_at | Timestamp |

**Expense**
| Field | Notes |
|-------|-------|
| id | Primary key |
| amount | Required, numeric, > 0 |
| category_id | Required, foreign key → Category |
| expense_date | Required, valid date |
| note | Optional, character limit |
| created_at | Timestamp |
| updated_at | Timestamp |

---

## 13. Entity Relationships

**One Category → Many Expenses**

- An Expense must reference a valid, existing Category (`category_id` is a required foreign key).
- A Category name must be unique.
- Deleting a Category that still has linked Expenses must be handled explicitly (e.g. block deletion, or require reassignment) — exact behavior to be confirmed during design.

---

## 14. Application Operations

**Category**
- Create
- Read
- Update
- Delete

**Expense**
- Create
- Read
- Update
- Delete

**Filtering**
- By category
- By date
- By date range

**Dashboard**
- Total expense
- Expense count
- Recent expenses
- Category-wise summary

*(These operations are defined independently of any programming language or framework.)*

---

## 15. Validation Rules

**Amount**
- Required
- Must be greater than 0

**Category**
- Required
- Must reference an existing category

**Date**
- Required
- Must be a valid date

**Note**
- Optional
- Reasonable character limit

---

## 16. Error Handling

| Error Scenario | Expected Behavior |
|---|---|
| Invalid amount | Clear message; entry not saved |
| Missing amount | Clear message; entry not saved |
| Missing category | Clear message; entry not saved |
| Invalid date | Clear message; entry not saved |
| Category not found | Clear message; operation blocked |
| Expense not found | Clear message; operation blocked |
| Duplicate category | Clear message; category not created |
| Invalid request | Clear, generic error message |
| Failed data operation | Clear message; user can retry |

Each error must provide a clear, understandable message to the user.

---

## 17. Non-Functional Requirements

The application should be:
- Simple
- Dynamic
- Maintainable
- Responsive
- User-friendly
- Reliable
- Easy to understand
- Easy to extend
- Free from unnecessary hardcoded business data

---

## 18. Acceptance Criteria

**Add Expense**
- User enters a valid amount.
- User selects an existing category.
- User selects a valid date.
- User can optionally enter a note.
- Expense is successfully stored.
- Expense appears in the history.
- Dashboard totals update.

**Dynamic Category**
- User creates a category.
- Category is stored successfully.
- Category appears automatically in the expense form.
- No source-code change is required.

**Delete Expense**
- User selects delete.
- Confirmation is displayed.
- Expense is removed.
- Expense history updates.
- Dashboard totals update.

**Edit Expense**
- User updates one or more fields.
- Validation rules are re-applied.
- Updated data is saved.
- Expense history and dashboard reflect the change.

**Delete Category**
- User selects delete on a category.
- Confirmation is displayed.
- If linked expenses exist, appropriate handling is triggered (block or reassign).
- Category list updates.

**Filtering**
- User applies a category, date, or date-range filter.
- Expense history updates to match the selected filter.
- Filters can be combined.

---

## 19. MVP vs Future Enhancements

**In MVP:** Add/View/Edit/Delete expense, dynamic category management, dashboard summary, basic filtering, persistent storage.

**Future Enhancements (not in MVP):**
- Income tracking
- Balance tracking
- Monthly budgets
- Savings goals
- Advanced charts
- Monthly/weekly reports
- PDF/Excel export
- Authentication
- Multiple users
- Recurring expenses
- AI spending insights
- Notifications
- Mobile application

---

## 20. High-Level Project Structure

A logical structure, independent of any specific technology:

- **User Interface Layer** — screens/pages for Dashboard, Add/Edit Expense, Expense History, Category Management
- **Application/Business Logic Layer** — handles expense and category operations, filtering logic, total calculation
- **Data Management Layer** — persistent storage and retrieval of Category and Expense records
- **Validation Layer** — enforces amount, category, date, and note rules before data is saved
- **Error Handling Layer** — captures and surfaces clear error messages across all operations
- **Configuration** — application-level settings, kept separate from business data

*(No specific technologies, programming languages, frameworks, libraries, databases, or hosting/deployment platforms are referenced. Technology decisions will be made separately.)*

---

*Document Version: 1.0*
*Status: Draft — MVP Scope*
