using Backend.Data.Repository;
using Backend.Domain.Models;

namespace Backend.App.Polizas;

public class SearchPolizasService(IRepository<Poliza, Guid> polizaRepo)
{
    private readonly IRepository<Poliza, Guid> _polizaRepo = polizaRepo;
    
}