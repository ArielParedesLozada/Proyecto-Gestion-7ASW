namespace Backend.Infrastructure.Jobs;

public class PolizaExpirationJob
{
    private readonly ILogger<PolizaExpirationJob> _logger;

    public PolizaExpirationJob(
        ILogger<PolizaExpirationJob> logger)
    {
        _logger = logger;
    }

    public Task EjecutarRevisionDiaria()
    {
        _logger.LogInformation(
            "Revisión diaria ejecutada: {fecha}",
            DateTime.UtcNow
        );

        return Task.CompletedTask;
    }
}