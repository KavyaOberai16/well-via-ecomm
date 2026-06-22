from sqlalchemy import select

from app.models.payment_gateway import PaymentGatewayConfig
from app.repositories.base import BaseRepository


class PaymentGatewayRepository(BaseRepository[PaymentGatewayConfig]):
    model = PaymentGatewayConfig

    def get_or_create(self) -> PaymentGatewayConfig:
        """Fetch the single config row, creating a blank "mock" one if the
        table is empty. The migration seeds a row, so this is just a safety
        net (e.g. fresh test DBs)."""
        row = self.db.execute(select(PaymentGatewayConfig)).scalars().first()
        if row is not None:
            return row
        return self.add(PaymentGatewayConfig())
