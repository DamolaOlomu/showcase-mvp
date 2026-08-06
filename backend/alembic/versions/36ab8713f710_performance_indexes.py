"""performance indexes — hot filter columns

Revision ID: 36ab8713f710
Revises: 6ec3d6c1c671
Create Date: 2026-08-06 00:00:00.000000

The composite unique constraints on likes/saves/follows (e.g.
uq_like_user_design on (user_id, design_id)) already create an index, but
that index only serves lookups on its *leading* column (user_id) well —
queries filtering by design_id alone (e.g. "how many likes does this
design have") still need a table/index scan. Same story for
designs.status (filtered on almost every public-facing query) and
designs.user_id (filtered whenever viewing someone's profile). These are
plain additive index creations — safe on a live database, no data changes.
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '36ab8713f710'
down_revision: Union[str, None] = '6ec3d6c1c671'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index('ix_likes_design_id', 'likes', ['design_id'])
    op.create_index('ix_saves_design_id', 'saves', ['design_id'])
    op.create_index('ix_follows_follower_id', 'follows', ['follower_id'])
    op.create_index('ix_follows_followed_id', 'follows', ['followed_id'])
    op.create_index('ix_designs_status', 'designs', ['status'])
    op.create_index('ix_designs_user_id', 'designs', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_designs_user_id', table_name='designs')
    op.drop_index('ix_designs_status', table_name='designs')
    op.drop_index('ix_follows_followed_id', table_name='follows')
    op.drop_index('ix_follows_follower_id', table_name='follows')
    op.drop_index('ix_saves_design_id', table_name='saves')
    op.drop_index('ix_likes_design_id', table_name='likes')
