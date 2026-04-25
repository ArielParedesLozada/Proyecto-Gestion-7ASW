using Backend.App.Renovaciones;

namespace Backend.Infrastructure.Jobs;

public class CheckRenovacionesJob(CreateRenovacionService renovacionService, ExpireRenovationService expireService)
{
    private readonly CreateRenovacionService _renovacionService = renovacionService;
    private readonly ExpireRenovationService _expireService = expireService;
    public async Task CheckRenovaciones()
    {
        await _renovacionService.CreateRenovacion();
        await _expireService.ExpireRenovations();
    }
}