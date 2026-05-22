using Backend.Data.Databases;
using Backend.Domain.Enums;
using Backend.Domain.Models;
using Backend.Domain.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MailKit.Net.Smtp;
using Backend.Infrastructure.Docs; // Para capturar SmtpCommandException

namespace Backend.App.Notificaciones;

public class PolizaNotificationService
{
    private readonly AppDatabase _context;
    private readonly IWordTemplate _wordService;
    private readonly INotifier _notifier;
    private readonly string _baseLink;
    private readonly ILogger<PolizaNotificationService> _logger;

    public PolizaNotificationService(
        IWordTemplate wordService,
        INotifier notifier,
        AppDatabase database,
        string baseLink,
        ILogger<PolizaNotificationService> logger)
    {
        _context = database;
        _wordService = wordService;
        _notifier = notifier;
        _baseLink = baseLink;
        _logger = logger;
    }

    public async Task ProcesarNotificacionesExpiracion()
    {
        _logger.LogInformation("🔍 Iniciando procesamiento de notificaciones de expiración");
        try
        {
            var renovaciones = await _context.Renovaciones
                .Include(r => r.PolizaNav).ThenInclude(p => p.AseguradoraNav)
                .Include(r => r.PolizaNav).ThenInclude(p => p.UsuarioNav)
                .Include(r => r.PolizaNav).ThenInclude(p => p.ContratistaNav)
                .Include(r => r.PolizaNav).ThenInclude(p => p.RamoNav)
                .Where(r => r.Estado == EstadoRenovacion.PorVencer)
                .ToListAsync();

            _logger.LogInformation("📊 Encontradas {Count} renovaciones", renovaciones.Count);

            foreach (var renovacion in renovaciones)
            {
                try
                {
                    await NotificarExpiracionAsync(renovacion);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Error procesando renovación {Id}", renovacion.Id);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Error crítico");
            throw;
        }
    }

    private async Task NotificarExpiracionAsync(Renovacion renovacion)
    {
        var poliza = renovacion.PolizaNav
            ?? throw new InvalidOperationException("Póliza no encontrada");

        // 🔒 Idempotencia
        var yaEnviada = await _context.Notificaciones.AnyAsync(n =>
            n.RenovacionId == renovacion.Id &&
            n.Tipo == TipoNotificacion.Expiracion &&
            n.Estado == EstadoNotificacion.Enviada
        );

        if (yaEnviada)
        {
            _logger.LogInformation("⏭️ Ya enviada {RenovacionId}", renovacion.Id);
            return;
        }

        var notificacion = new Notificacion
        {
            Id = Guid.NewGuid(),
            PolizaId = poliza.Id,
            RenovacionId = renovacion.Id,
            Tipo = TipoNotificacion.Expiracion,
            Estado = EstadoNotificacion.Pendiente,
            CreatedAt = DateTimeOffset.UtcNow
        };

        await _context.Notificaciones.AddAsync(notificacion);
        await _context.SaveChangesAsync();

        try
        {
            // 📄 DOCUMENTO CON FALLBACK
            var ramoNombre = poliza.RamoNav?.Nombre ?? "GENERAL";
            var templateName = $"{ramoNombre.Trim().ToLower().Replace(" ", "-")}-template.docx";
            var dto = new PolizaDocumentoDto
            {
                Aseguradora = poliza.AseguradoraNav?.Nombre ?? "NO ESPECIFICADA",
                Obra = poliza.Obra ?? "NO ESPECIFICADA",
                Contratista = poliza.ContratistaNav?.Nombre ?? "NO ESPECIFICADO",
                NumeroPoliza = poliza.Numero,
                Valor = renovacion.Valor,
                FechaRenovacion = renovacion.FechaRenovacion,
                FechaExpiracion = renovacion.FechaExpiracion
            };

            var data = PolizaWordAdapter.Map(dto);

            var docBytes = _wordService.Generate(
                templateName,
                data
            );

            _logger.LogInformation("✅ Documento generado");

            // 📧 EMAIL
            var link = $"{_baseLink}/polizas/{poliza.Id}";
            var bodyHtml = BuildBody(poliza, link);
            var subject = "Notificación de expiración de póliza";
            var fileName = $"Poliza-{poliza.Numero}.docx";
            var destinatario = poliza.UsuarioNav?.Email;
            var success = false;
            try
            {
                _logger.LogDebug("📤 Enviando a {Email}", destinatario);

                await _notifier.SendWithAttachmentAsync(
                    destinatario,
                    subject,
                    bodyHtml,
                    docBytes,
                    fileName
                );

                success = true;

                // 🔥 Throttle para Mailtrap
                await Task.Delay(500);
            }
            catch (SmtpCommandException ex) when (ex.Message.Contains("Too many emails"))
            {
                _logger.LogWarning("⏳ Rate limit, reintentando...");

                await Task.Delay(1000);

                await _notifier.SendWithAttachmentAsync(
                    destinatario,
                    subject,
                    bodyHtml,
                    docBytes,
                    fileName
                );

                success = true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error enviando a {Email}", destinatario);
            }
            if (!success)
                throw new InvalidOperationException("No se pudo enviar a ningún destinatario");

            notificacion.Estado = EstadoNotificacion.Enviada;
            notificacion.FechaEnvio = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("✅ Notificación enviada {Id}", notificacion.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Error en notificación");

            notificacion.Estado = EstadoNotificacion.Error;
            await _context.SaveChangesAsync();
        }
    }

    private string BuildBody(Poliza p, string? link = null)
    {
        var linkHtml = string.IsNullOrEmpty(link)
            ? "<p><em>No hay enlace disponible</em></p>"
            : $"<a href='{link}'>📎 Ver póliza</a>";

        return $@"
        <h3>📢 Notificación de expiración</h3>
        <p>La póliza <strong>{p.Numero}</strong> está próxima a expirar.</p>
        <br/>
        {linkHtml}
        <br/>
        <small>Mensaje automático</small>
        ";
    }
}