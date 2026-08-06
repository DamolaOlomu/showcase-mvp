"""user profile fields — cover photo + social links

Revision ID: 6ec3d6c1c671
Revises: 5dbb99d17cd1
Create Date: 2026-08-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6ec3d6c1c671'
down_revision: Union[str, None] = '5dbb99d17cd1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('cover_url', sa.String(), nullable=True))
    op.add_column('users', sa.Column('instagram_url', sa.String(), nullable=True))
    op.add_column('users', sa.Column('linkedin_url', sa.String(), nullable=True))
    op.add_column('users', sa.Column('github_url', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'github_url')
    op.drop_column('users', 'linkedin_url')
    op.drop_column('users', 'instagram_url')
    op.drop_column('users', 'cover_url')
