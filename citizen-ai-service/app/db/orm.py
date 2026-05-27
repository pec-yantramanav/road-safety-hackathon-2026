from sqlalchemy import Column, String, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry
from app.dependencies import Base

class Jurisdiction(Base):
    __tablename__ = "jurisdictions"
    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String(255), nullable=False)
    level = Column(String(50), nullable=False)
    authority_type = Column(String(50), nullable=False)
    geometry = Column(Geometry("MULTIPOLYGON", srid=4326))
    parent_id = Column(UUID(as_uuid=True), ForeignKey("jurisdictions.id"))

class Blackspot(Base):
    __tablename__ = "blackspots"
    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String(255))
    location = Column(Geometry("POINT", srid=4326), nullable=False)
    radius_m = Column(Integer, default=200)
    severity = Column(String(50), default="HIGH")
