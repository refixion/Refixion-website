"""add invoice fields to orders

Revision ID: d47051cf04d1
Revises: 0001
Create Date: 2026-08-18 21:00:19.551115

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d47051cf04d1"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column(
            "invoice_number",
            sa.String(),
            nullable=True,
        ),
    )

    op.add_column(
        "orders",
        sa.Column(
            "invoice_url",
            sa.Text(),
            nullable=True,
        ),
    )

    op.add_column(
        "orders",
        sa.Column(
            "invoice_created_at",
            sa.Text(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("orders", "invoice_created_at")
    op.drop_column("orders", "invoice_url")
    op.drop_column("orders", "invoice_number")