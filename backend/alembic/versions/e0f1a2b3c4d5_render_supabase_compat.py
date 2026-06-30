"""render supabase compatibility revision

Revision ID: e0f1a2b3c4d5
Revises: 7c9e1a2b3d4f
Create Date: 2026-06-30
"""

from typing import Sequence, Union


revision: str = "e0f1a2b3c4d5"
down_revision: Union[str, Sequence[str], None] = "7c9e1a2b3d4f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
