"""add auth tables and user data isolation

Revision ID: c83d5a231f4e
Revises: b74f3e129c1d
Create Date: 2026-08-31 18:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c83d5a231f4e'
down_revision: Union[str, None] = 'b74f3e129c1d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=True),
        sa.Column('full_name', sa.String(length=150), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('is_verified', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('google_id', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_google_id'), 'users', ['google_id'], unique=True)

    # 2. Create refresh_tokens table
    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_refresh_tokens_id'), 'refresh_tokens', ['id'], unique=False)
    op.create_index(op.f('ix_refresh_tokens_user_id'), 'refresh_tokens', ['user_id'], unique=False)
    op.create_index(op.f('ix_refresh_tokens_token_hash'), 'refresh_tokens', ['token_hash'], unique=True)

    # 3. Create password_reset_tokens table
    op.create_table(
        'password_reset_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_used', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_password_reset_tokens_id'), 'password_reset_tokens', ['id'], unique=False)
    op.create_index(op.f('ix_password_reset_tokens_user_id'), 'password_reset_tokens', ['user_id'], unique=False)
    op.create_index(op.f('ix_password_reset_tokens_token_hash'), 'password_reset_tokens', ['token_hash'], unique=True)

    # 4. Add user_id to categories
    with op.batch_alter_table('categories') as batch_op:
        try:
            batch_op.drop_index('ix_categories_name')
        except Exception:
            pass
        batch_op.create_index(op.f('ix_categories_name'), ['name'], unique=False)
        batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_categories_user_id', 'users', ['user_id'], ['id'], ondelete='CASCADE')
        batch_op.create_index(op.f('ix_categories_user_id'), ['user_id'], unique=False)
        batch_op.create_unique_constraint('uq_user_category_name', ['user_id', 'name'])

    # 5. Add user_id to expenses
    with op.batch_alter_table('expenses') as batch_op:
        batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_expenses_user_id', 'users', ['user_id'], ['id'], ondelete='CASCADE')
        batch_op.create_index(op.f('ix_expenses_user_id'), ['user_id'], unique=False)

    # 6. Add user_id to budgets
    with op.batch_alter_table('budgets') as batch_op:
        batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_budgets_user_id', 'users', ['user_id'], ['id'], ondelete='CASCADE')
        batch_op.create_index(op.f('ix_budgets_user_id'), ['user_id'], unique=False)
        batch_op.create_unique_constraint('uq_user_period_category', ['user_id', 'period_type', 'category_id'])


def downgrade() -> None:
    with op.batch_alter_table('budgets') as batch_op:
        batch_op.drop_constraint('uq_user_period_category', type_='unique')
        batch_op.drop_index(op.f('ix_budgets_user_id'))
        batch_op.drop_constraint('fk_budgets_user_id', type_='foreignkey')
        batch_op.drop_column('user_id')

    with op.batch_alter_table('expenses') as batch_op:
        batch_op.drop_index(op.f('ix_expenses_user_id'))
        batch_op.drop_constraint('fk_expenses_user_id', type_='foreignkey')
        batch_op.drop_column('user_id')

    with op.batch_alter_table('categories') as batch_op:
        batch_op.drop_constraint('uq_user_category_name', type_='unique')
        batch_op.drop_index(op.f('ix_categories_user_id'))
        batch_op.drop_constraint('fk_categories_user_id', type_='foreignkey')
        batch_op.drop_column('user_id')

    op.drop_index(op.f('ix_password_reset_tokens_token_hash'), table_name='password_reset_tokens')
    op.drop_index(op.f('ix_password_reset_tokens_user_id'), table_name='password_reset_tokens')
    op.drop_index(op.f('ix_password_reset_tokens_id'), table_name='password_reset_tokens')
    op.drop_table('password_reset_tokens')

    op.drop_index(op.f('ix_refresh_tokens_token_hash'), table_name='refresh_tokens')
    op.drop_index(op.f('ix_refresh_tokens_user_id'), table_name='refresh_tokens')
    op.drop_index(op.f('ix_refresh_tokens_id'), table_name='refresh_tokens')
    op.drop_table('refresh_tokens')

    op.drop_index(op.f('ix_users_google_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
