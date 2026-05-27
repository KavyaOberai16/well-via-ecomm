"""add rbac + tax + coupon + wishlist; extend orders with tax/discount

Revision ID: a1b2c3d4e5f6
Revises: 1039aa3784eb
Create Date: 2026-05-27 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "1039aa3784eb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---------- RBAC ----------
    op.create_table(
        "permissions",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("group_name", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("name", name="uq_permissions_name"),
    )
    op.create_index(op.f("ix_permissions_name"), "permissions", ["name"], unique=False)
    op.create_index(op.f("ix_permissions_group_name"), "permissions", ["group_name"], unique=False)

    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("is_system", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("name", name="uq_roles_name"),
    )
    op.create_index(op.f("ix_roles_name"), "roles", ["name"], unique=False)

    op.create_table(
        "role_permissions",
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("permission_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("role_id", "permission_id"),
    )

    op.create_table(
        "user_roles",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "role_id"),
    )

    # ---------- Tax ----------
    op.create_table(
        "taxes",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("rate", sa.Numeric(precision=6, scale=3), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(op.f("ix_taxes_is_active"), "taxes", ["is_active"], unique=False)

    op.create_table(
        "product_taxes",
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("tax_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tax_id"], ["taxes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("product_id", "tax_id"),
    )

    # ---------- Coupons ----------
    op.create_table(
        "coupons",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column(
            "discount_type",
            sa.Enum("FIXED", "PERCENT", name="discounttype"),
            nullable=False,
        ),
        sa.Column("discount_value", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("min_order_amount", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("max_discount", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("usage_limit", sa.Integer(), nullable=True),
        sa.Column("usage_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("per_user_limit", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("code", name="uq_coupons_code"),
    )
    op.create_index(op.f("ix_coupons_code"), "coupons", ["code"], unique=False)
    op.create_index(op.f("ix_coupons_expires_at"), "coupons", ["expires_at"], unique=False)
    op.create_index(op.f("ix_coupons_is_active"), "coupons", ["is_active"], unique=False)

    op.create_table(
        "coupon_usages",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("coupon_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=True),
        sa.Column("discount_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["coupon_id"], ["coupons.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="SET NULL"),
    )
    op.create_index(op.f("ix_coupon_usages_coupon_id"), "coupon_usages", ["coupon_id"], unique=False)
    op.create_index(op.f("ix_coupon_usages_user_id"), "coupon_usages", ["user_id"], unique=False)
    op.create_index(op.f("ix_coupon_usages_order_id"), "coupon_usages", ["order_id"], unique=False)

    # ---------- Wishlist ----------
    op.create_table(
        "wishlists",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "product_id", name="uq_wishlists_user_product"),
    )
    op.create_index(op.f("ix_wishlists_user_id"), "wishlists", ["user_id"], unique=False)
    op.create_index(op.f("ix_wishlists_product_id"), "wishlists", ["product_id"], unique=False)

    # ---------- Orders: snapshot tax/discount ----------
    op.add_column(
        "orders",
        sa.Column("subtotal", sa.Numeric(precision=12, scale=2), nullable=False, server_default=sa.text("0")),
    )
    op.add_column(
        "orders",
        sa.Column("tax_amount", sa.Numeric(precision=12, scale=2), nullable=False, server_default=sa.text("0")),
    )
    op.add_column(
        "orders",
        sa.Column(
            "discount_amount",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )
    op.add_column("orders", sa.Column("coupon_code", sa.String(length=64), nullable=True))


def downgrade() -> None:
    op.drop_column("orders", "coupon_code")
    op.drop_column("orders", "discount_amount")
    op.drop_column("orders", "tax_amount")
    op.drop_column("orders", "subtotal")

    op.drop_index(op.f("ix_wishlists_product_id"), table_name="wishlists")
    op.drop_index(op.f("ix_wishlists_user_id"), table_name="wishlists")
    op.drop_table("wishlists")

    op.drop_index(op.f("ix_coupon_usages_order_id"), table_name="coupon_usages")
    op.drop_index(op.f("ix_coupon_usages_user_id"), table_name="coupon_usages")
    op.drop_index(op.f("ix_coupon_usages_coupon_id"), table_name="coupon_usages")
    op.drop_table("coupon_usages")

    op.drop_index(op.f("ix_coupons_is_active"), table_name="coupons")
    op.drop_index(op.f("ix_coupons_expires_at"), table_name="coupons")
    op.drop_index(op.f("ix_coupons_code"), table_name="coupons")
    op.drop_table("coupons")

    op.drop_table("product_taxes")
    op.drop_index(op.f("ix_taxes_is_active"), table_name="taxes")
    op.drop_table("taxes")

    op.drop_table("user_roles")
    op.drop_table("role_permissions")
    op.drop_index(op.f("ix_roles_name"), table_name="roles")
    op.drop_table("roles")
    op.drop_index(op.f("ix_permissions_group_name"), table_name="permissions")
    op.drop_index(op.f("ix_permissions_name"), table_name="permissions")
    op.drop_table("permissions")
