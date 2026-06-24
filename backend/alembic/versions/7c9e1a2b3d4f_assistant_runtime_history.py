"""add assistant runtime settings and chat history

Revision ID: 7c9e1a2b3d4f
Revises: 4b6c8d0e1f2a
Create Date: 2026-06-22
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "7c9e1a2b3d4f"
down_revision: Union[str, Sequence[str], None] = "4b6c8d0e1f2a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


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


def _json_type() -> sa.types.TypeEngine:
    if op.get_bind().dialect.name == "postgresql":
        return postgresql.JSONB()
    return sa.JSON()


def _create_index_if_missing(
    index_name: str,
    table_name: str,
    columns: list[str],
    *,
    unique: bool = False,
) -> None:
    if _table_exists(table_name) and not _index_exists(table_name, index_name):
        op.create_index(index_name, table_name, columns, unique=unique)


def _add_column_if_missing(table_name: str, column: sa.Column) -> None:
    if _table_exists(table_name) and not _column_exists(table_name, column.name):
        op.add_column(table_name, column)


def upgrade() -> None:
    if not _table_exists("assistant_runtime_settings"):
        op.create_table(
            "assistant_runtime_settings",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("update_interval_hours", sa.Float(), nullable=False),
            sa.Column("gigachat_model", sa.String(length=64), nullable=False),
            sa.Column("question_max_length", sa.Integer(), nullable=False),
            sa.Column("session_ttl_seconds", sa.Integer(), nullable=False),
            sa.Column("history_max_messages", sa.Integer(), nullable=False),
            sa.Column("rate_limit_window_seconds", sa.Integer(), nullable=False),
            sa.Column("rate_limit_max_requests", sa.Integer(), nullable=False),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
        )

    if not _table_exists("assistant_chat_session"):
        op.create_table(
            "assistant_chat_session",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("session_key", sa.String(length=255), nullable=False),
            sa.Column("session_id", sa.String(length=120), nullable=False),
            sa.Column("access_scope", sa.String(length=20), nullable=False),
            sa.Column("user_role", sa.String(length=100), nullable=True),
            sa.Column("user_id", sa.Integer(), nullable=True),
            sa.Column("user_email", sa.String(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("session_key", name="uq_assistant_chat_session_session_key"),
        )

    _create_index_if_missing(
        "assistant_chat_session_user_idx",
        "assistant_chat_session",
        ["user_id"],
    )
    _create_index_if_missing(
        "assistant_chat_session_updated_idx",
        "assistant_chat_session",
        ["updated_at"],
    )
    _create_index_if_missing(
        "ix_assistant_chat_session_session_key",
        "assistant_chat_session",
        ["session_key"],
        unique=True,
    )

    if _table_exists("assistant_chat_session") and _column_exists("assistant_chat_session", "username"):
        op.drop_column("assistant_chat_session", "username")

    if not _table_exists("assistant_chat_message"):
        op.create_table(
            "assistant_chat_message",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("assistant_session_id", sa.Integer(), nullable=False),
            sa.Column("turn_id", sa.String(length=64), nullable=False),
            sa.Column("role", sa.String(length=20), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("metadata", _json_type(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.ForeignKeyConstraint(
                ["assistant_session_id"],
                ["assistant_chat_session.id"],
                ondelete="CASCADE",
            ),
            sa.PrimaryKeyConstraint("id"),
        )

    _create_index_if_missing(
        "assistant_chat_message_session_idx",
        "assistant_chat_message",
        ["assistant_session_id", "id"],
    )
    _create_index_if_missing(
        "assistant_chat_message_turn_idx",
        "assistant_chat_message",
        ["turn_id"],
    )

    _add_column_if_missing("appointments", sa.Column("user_id", sa.Integer(), nullable=True))
    _add_column_if_missing("appointments", sa.Column("user_email", sa.String(), nullable=True))
    _add_column_if_missing(
        "appointments",
        sa.Column("status", sa.String(length=20), server_default="new", nullable=False),
    )
    _add_column_if_missing(
        "appointments",
        sa.Column("source", sa.String(length=20), server_default="site", nullable=False),
    )
    _add_column_if_missing(
        "appointments",
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
    )
    _create_index_if_missing("appointments_user_id_idx", "appointments", ["user_id"])
    _create_index_if_missing("appointments_status_idx", "appointments", ["status"])

    _add_column_if_missing("tpmpk_appointment", sa.Column("user_id", sa.Integer(), nullable=True))
    _add_column_if_missing("tpmpk_appointment", sa.Column("user_email", sa.String(length=255), nullable=True))
    _create_index_if_missing("tpmpk_appointment_user_id_idx", "tpmpk_appointment", ["user_id"])


def downgrade() -> None:
    if _table_exists("tpmpk_appointment"):
        if _index_exists("tpmpk_appointment", "tpmpk_appointment_user_id_idx"):
            op.drop_index("tpmpk_appointment_user_id_idx", table_name="tpmpk_appointment")
        for column_name in ("user_email", "user_id"):
            if _column_exists("tpmpk_appointment", column_name):
                op.drop_column("tpmpk_appointment", column_name)

    if _table_exists("appointments"):
        for index_name in ("appointments_status_idx", "appointments_user_id_idx"):
            if _index_exists("appointments", index_name):
                op.drop_index(index_name, table_name="appointments")
        for column_name in ("updated_at", "source", "status", "user_email", "user_id"):
            if _column_exists("appointments", column_name):
                op.drop_column("appointments", column_name)

    if _table_exists("assistant_chat_message"):
        for index_name in (
            "assistant_chat_message_turn_idx",
            "assistant_chat_message_session_idx",
        ):
            if _index_exists("assistant_chat_message", index_name):
                op.drop_index(index_name, table_name="assistant_chat_message")
        op.drop_table("assistant_chat_message")

    if _table_exists("assistant_chat_session"):
        for index_name in (
            "ix_assistant_chat_session_session_key",
            "assistant_chat_session_updated_idx",
            "assistant_chat_session_user_idx",
        ):
            if _index_exists("assistant_chat_session", index_name):
                op.drop_index(index_name, table_name="assistant_chat_session")
        op.drop_table("assistant_chat_session")

    if _table_exists("assistant_runtime_settings"):
        op.drop_table("assistant_runtime_settings")
