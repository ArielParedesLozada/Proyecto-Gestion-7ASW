namespace Backend.Domain.Services;

public interface INotifier
{
    Task SendAsync(string to, string subject, string body);
    Task SendWithAttachmentAsync(string to, string subject, string body, byte[] file, string fileName);
}