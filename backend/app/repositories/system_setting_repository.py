from sqlalchemy import select

from app.models.system_setting import SystemSetting
from app.repositories.base import BaseRepository


class SystemSettingRepository(BaseRepository[SystemSetting]):
    model = SystemSetting

    def get_by_key(self, key: str) -> SystemSetting | None:
        return self.db.execute(
            select(SystemSetting).where(SystemSetting.key == key)
        ).scalar_one_or_none()

    def list_all(self) -> list[SystemSetting]:
        return list(
            self.db.execute(select(SystemSetting).order_by(SystemSetting.id)).scalars().all()
        )

    def list_by_category(self, category: str) -> list[SystemSetting]:
        return list(
            self.db.execute(
                select(SystemSetting)
                .where(SystemSetting.category == category)
                .order_by(SystemSetting.id)
            )
            .scalars()
            .all()
        )
