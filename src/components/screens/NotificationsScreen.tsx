import { useAppStore } from '../../store/useAppStore';
import type { Notification } from '../../types';

function NotifCard({ notif }: { notif: Notification }) {
  const resolveNotification = useAppStore((s) => s.resolveNotification);

  return (
    <div className={`notif-card ${notif.kind} ${notif.resolved ? 'resolved' : ''}`}>
      <span className="material-symbols-outlined notif-icon">{notif.icon}</span>

      <div className="notif-body">
        <span className="notif-title">{notif.title}</span>
        <span className="notif-meta">{notif.meta}</span>
        {notif.detail && <span className="notif-detail">{notif.detail}</span>}

        {notif.actions && (
          <div className="notif-actions">
            {notif.actions.map((action) => (
              <button
                key={action.label}
                className={action.primary ? 'primary' : ''}
                onClick={() => {
                  if (action.resolves !== false) resolveNotification(notif.id);
                }}
              >
                {action.icon && (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '14px' }}
                  >
                    {action.icon}
                  </span>
                )}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function NotificationsScreen() {
  const activeScreen = useAppStore((s) => s.activeScreen);
  const notifications = useAppStore((s) => s.notifications);

  const today = notifications.filter((n) => n.section === 'today');
  const earlier = notifications.filter((n) => n.section === 'earlier');

  return (
    <section
      className={`screen ${activeScreen === 'notifications' ? 'active' : ''}`}
      id="screen-notifications"
    >
      <div className="section-label">Dnes</div>
      <div className="notif-list">
        {today.map((n) => (
          <NotifCard key={n.id} notif={n} />
        ))}
      </div>

      <div className="section-label">Dříve</div>
      <div className="notif-list">
        {earlier.map((n) => (
          <NotifCard key={n.id} notif={n} />
        ))}
      </div>
    </section>
  );
}
