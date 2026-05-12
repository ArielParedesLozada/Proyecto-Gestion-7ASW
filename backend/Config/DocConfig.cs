using Backend.Domain.Services;
using Backend.Infrastructure.Docs;

namespace Backend.Config;

public static class DocConfig
{
    public static IServiceCollection AddDocs(this IServiceCollection services, IConfiguration configuration)
    {
        var fileTemplatesPath = configuration.GetValue<string>("Templates:Path")!;
        services.AddScoped<IWordTemplate, WordTemplateService>(sp =>
        {
            return new WordTemplateService(fileTemplatesPath);
        });
        return services;
    }
}