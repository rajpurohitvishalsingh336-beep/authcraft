"""add_v2_layout_fields

Revision ID: a03d30558e94
Revises: 8ff553ed6df9
Create Date: 2026-10-24 00:36:02.919539

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a03d30558e94'
down_revision: Union[str, None] = '8ff553ed6df9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('project_configurations', sa.Column('layout_id', sa.String(length=50), nullable=True, server_default='minimal-clean-01'))
    op.add_column('project_configurations', sa.Column('layout_tokens', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('project_configurations', 'layout_tokens')
    op.drop_column('project_configurations', 'layout_id')
