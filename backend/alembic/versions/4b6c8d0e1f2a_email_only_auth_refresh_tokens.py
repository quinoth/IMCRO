"""email-only auth and refresh tokens

Revision ID: 4b6c8d0e1f2a
Revises: 3f2a8c9d1e6b
Create Date: 2026-06-22
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "4b6c8d0e1f2a"
down_revision: Union[str, Sequence[str], None] = "3f2a8c9d1e6b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

USERNAME_TABLES = (
    "users",
    "appointments",
    "tpmpk_appointment",
)


def _inspector() -> sa.Inspector:
    return sa.inspect(op.get_bind())


def _table_exists(table_name: str) -> bool:
    return table_name in _inspector().get_table_names()


def _column_exists(table_name: str, column_name: str) -> bool:
    if not _table_exists(table_name):
        return False
    return column_name in {
        column["name"]
        for column in _inspector().get_columns(table_name)
    }


def _index_exists(table_name: str, index_name: str) -> bool:
    if not _table_exists(table_name):
        return False
    return index_name in {
        index["name"]
        for index in _inspector().get_indexes(table_name)
    }


def _add_json_column(table_name: str, column_name: str, default_sql: str) -> None:
    if _column_exists(table_name, column_name):
        return
    json_type = postgresql.JSONB() if op.get_bind().dialect.name == "postgresql" else sa.JSON()
    op.add_column(
        table_name,
        sa.Column(
            column_name,
            json_type,
            nullable=False,
            server_default=sa.text(default_sql),
        ),
    )


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if _table_exists("users") and _index_exists("users", "ix_users_username"):
        op.drop_index("ix_users_username", table_name="users")

    for table_name in USERNAME_TABLES:
        if _column_exists(table_name, "username"):
            op.drop_column(table_name, "username")

    if _table_exists("users"):
        if not _column_exists("users", "created_at"):
            op.add_column("users", sa.Column("created_at", sa.DateTime(timezone=True), nullable=True))

        if dialect == "postgresql":
            op.execute("UPDATE users SET created_at = now() WHERE created_at IS NULL")
            op.alter_column(
                "users",
                "created_at",
                existing_type=sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            )
            _add_json_column("users", "allowed_methodika_subjects", "'[]'::jsonb")
        else:
            op.execute("UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL")
            _add_json_column("users", "allowed_methodika_subjects", "'[]'")

    if _table_exists("user_role"):
        if not _column_exists("user_role", "can_access_internal_docs"):
            op.add_column(
                "user_role",
                sa.Column(
                    "can_access_internal_docs",
                    sa.Boolean(),
                    nullable=False,
                    server_default=sa.false(),
                ),
            )
        if dialect == "postgresql":
            op.execute(
                """
                UPDATE user_role
                SET can_access_internal_docs = TRUE
                WHERE role_name IN ('admin', 'administrator', 'employee', 'staff', 'manager')
                   OR lower(role_name) IN ('admin', 'administrator', 'employee', 'staff', 'manager')
                """
            )
        else:
            op.execute(
                """
                UPDATE user_role
                SET can_access_internal_docs = 1
                WHERE role_name IN ('admin', 'administrator', 'employee', 'staff', 'manager')
                   OR lower(role_name) IN ('admin', 'administrator', 'employee', 'staff', 'manager')
                """
            )


def downgrade() -> None:
    if _table_exists("user_role") and _column_exists("user_role", "can_access_internal_docs"):
        op.drop_column("user_role", "can_access_internal_docs")

    if _table_exists("users") and _column_exists("users", "allowed_methodika_subjects"):
        op.drop_column("users", "allowed_methodika_subjects")

    for table_name in USERNAME_TABLES:
        if _table_exists(table_name) and not _column_exists(table_name, "username"):
            op.add_column(table_name, sa.Column("username", sa.String(length=100), nullable=True))

    if _table_exists("users") and not _index_exists("users", "ix_users_username"):
        op.create_index("ix_users_username", "users", ["username"], unique=True)
