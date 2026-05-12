using Backend.Domain.Services;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace Backend.Infrastructure.Docs;

public class WordTemplateService(string templatesPath) : IWordTemplate
{
    private readonly string _templatesPath = templatesPath;
    private readonly string TEMPLATE_FALLBACK = "example-template.docx";
    public byte[] Generate(string templateName, Dictionary<string, string> data)
    {
        if (!TemplateExists(templateName))
        {
            templateName = TEMPLATE_FALLBACK;
        }
        var fullPath = Path.Combine(_templatesPath, templateName);
        if (!File.Exists(fullPath))
            throw new Exception($"Template {templateName} not found");
        using var mem = new MemoryStream(File.ReadAllBytes(fullPath));
        using (var doc = WordprocessingDocument.Open(mem, true))
        {
            var sdtElements = doc.MainDocumentPart!
                .Document
                .Descendants<SdtElement>();
            foreach (var sdt in sdtElements)
            {
                var tag = sdt.SdtProperties?
                    .GetFirstChild<Tag>()?
                    .Val?
                    .Value;
                if (tag == null)
                    continue;
                if (!data.ContainsKey(tag))
                    continue;
                var value = data[tag] ?? "";
                var text = sdt.Descendants<Text>().FirstOrDefault();
                if (text != null)
                {
                    text.Text = value;
                }
            }
        }
        return mem.ToArray();
    }

    public bool TemplateExists(string templateName)
    {
        var fullPath = Path.Combine(_templatesPath, templateName);
        return File.Exists(fullPath);
    }
}