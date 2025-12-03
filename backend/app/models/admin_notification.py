"""
Modèle AdminNotification pour les notifications administrateur
"""
from datetime import datetime
from app import db
import uuid


class AdminNotification(db.Model):
    """Modèle pour les notifications administrateur"""
    __tablename__ = 'admin_notifications'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    type = db.Column(db.String(50), nullable=False)  # 'pending_user', 'pending_validation', etc.
    target_user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relation vers l'utilisateur cible
    target_user = db.relationship('User', backref=db.backref('admin_notifications', lazy='dynamic'))

    def to_dict(self):
        """Convertit la notification en dictionnaire"""
        return {
            'id': self.id,
            'type': self.type,
            'targetUserId': self.target_user_id,
            'message': self.message,
            'isRead': self.is_read,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'targetUser': {
                'id': self.target_user.id,
                'name': self.target_user.name,
                'email': self.target_user.email,
                'role': self.target_user.role.value if self.target_user.role else None,
            } if self.target_user else None,
        }

    def __repr__(self):
        return f'<AdminNotification {self.id} - {self.type}>'
