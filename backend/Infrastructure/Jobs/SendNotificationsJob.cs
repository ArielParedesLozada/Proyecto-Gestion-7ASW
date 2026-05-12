using Backend.App.Notificaciones;

namespace Backend.Infrastructure.Jobs;

public class SendNotificationsJob(PolizaNotificationService notificationService)
{
    private readonly PolizaNotificationService _notificationService = notificationService;
    public async Task NotifyPeople()
    {
        await _notificationService.ProcesarNotificacionesExpiracion();
    }
}