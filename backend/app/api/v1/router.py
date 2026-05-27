from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    cart,
    categories,
    coupons,
    hero_slides,
    orders,
    payments,
    products,
    reviews,
    roles,
    taxes,
    users,
    wishlist,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(hero_slides.router, prefix="/hero-slides", tags=["hero-slides"])
api_router.include_router(cart.router, prefix="/cart", tags=["cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(payments.checkout_router, prefix="/checkout", tags=["checkout"])
api_router.include_router(payments.payments_router, prefix="/payments", tags=["payments"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(taxes.router, prefix="/taxes", tags=["taxes"])
api_router.include_router(coupons.router, prefix="/coupons", tags=["coupons"])
api_router.include_router(wishlist.router, prefix="/wishlist", tags=["wishlist"])
# Reviews are surfaced under /products/{id}/reviews (public + user-create) and
# under /reviews (user-edit/delete + admin CRUD).
api_router.include_router(reviews.public_router, prefix="/products", tags=["reviews"])
api_router.include_router(reviews.admin_router, prefix="/reviews", tags=["reviews"])
