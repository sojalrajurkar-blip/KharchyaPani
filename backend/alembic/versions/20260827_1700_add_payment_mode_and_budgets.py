"""add payment mode and budgets tables

Revision ID: b74f3e129c1d
Revises: 995f5b982aff
Create Date: 2026-08-27 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b74f3e129c1d'
down_revision: Union[str, None] = '995f5b982aff'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add payment_mode column to expenses table
    op.add_column('expenses', sa.Column('payment_mode', sa.String(length=50), server_default='Cash', nullable=False))
    op.create_index(op.f('ix_expenses_payment_mode'), 'expenses', ['payment_mode'], unique=False)

    # 2. Create budgets table
    op.create_table('budgets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('period_type', sa.String(length=20), server_default='monthly', nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('amount_limit', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.CheckConstraint('amount_limit > 0', name='check_budget_amount_limit_positive'),
        sa.CheckConstraint("period_type IN ('daily', 'monthly')", name='check_budget_period_type_valid'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_budgets_id'), 'budgets', ['id'], unique=False)
    op.create_index(op.f('ix_budgets_period_type'), 'budgets', ['period_type'], unique=False)
    op.create_index(op.f('ix_budgets_category_id'), 'budgets', ['category_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_budgets_category_id'), table_name='budgets')
    op.drop_index(op.f('ix_budgets_period_type'), table_name='budgets')
    op.drop_index(op.f('ix_budgets_id'), table_name='budgets')
    op.drop_table('budgets')

    op.drop_index(op.f('ix_expenses_payment_mode'), table_name='expenses')
    op.drop_column('expenses', 'payment_mode')
