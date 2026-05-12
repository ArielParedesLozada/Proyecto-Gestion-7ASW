namespace Backend.Domain.Services;

public interface IWordTemplate
{
    public bool TemplateExists(string templateName);
    public byte[] Generate(string templateName, Dictionary<string, string> data);
}