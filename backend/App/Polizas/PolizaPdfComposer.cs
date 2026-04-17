using System.Globalization;
using Backend.App.Dtos;
using Backend.Domain.Enums;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Backend.App.Polizas;

/// <summary>Genera el PDF institucional de una póliza (QuestPDF).</summary>
public static class PolizaPdfComposer
{
    private static readonly TimeSpan OffsetColombia = TimeSpan.FromHours(-5);

    private const string Institucion = "Gobierno Provincial de Tungurahua";
    private const string Sistema = "SICOP";

    static PolizaPdfComposer()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public static byte[] Generate(PolizaRes poliza, string? logoPath, DateTimeOffset generadoEn)
    {
        var reporteId = $"SICOP-POL-{poliza.Id:N}".ToUpperInvariant();
        var generadoTexto = generadoEn.ToOffset(OffsetColombia)
            .ToString("dd/MM/yyyy HH:mm", CultureInfo.GetCultureInfo("es-CO"));

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(10).FontColor("#334155").LineHeight(1.25f));

                page.Header().Element(h => ComposeHeader(h, poliza, logoPath, reporteId, generadoTexto));
                page.Content().Element(c => ComposeContent(c, poliza));
                page.Footer().Element(ComposeFooter);
            });
        }).GeneratePdf();
    }

    private static void ComposeHeader(
        IContainer container,
        PolizaRes poliza,
        string? logoPath,
        string reporteId,
        string generadoTexto)
    {
        container.Column(column =>
        {
            column.Spacing(8);
            column.Item().Background("#f8fafc").BorderBottom(1).BorderColor("#e2e8f0").PaddingBottom(10).PaddingHorizontal(6).Row(row =>
            {
                if (!string.IsNullOrEmpty(logoPath) && File.Exists(logoPath))
                {
                    row.ConstantItem(84).Height(60).Image(logoPath).FitArea();
                }
                else
                {
                    row.ConstantItem(84).Height(60);
                }

                row.RelativeItem().Column(right =>
                {
                    right.Spacing(2);
                    right.Item().Text(Sistema).FontSize(12).SemiBold().FontColor("#b91c1c");
                    right.Item().Text(Institucion).FontSize(9).FontColor("#64748b");
                    right.Item().PaddingTop(5).Text("Reporte individual de póliza")
                        .FontSize(18).SemiBold().FontColor("#0f172a");
                    right.Item().Text("Informe institucional de seguimiento y trazabilidad")
                        .FontSize(9).FontColor("#64748b");
                });
            });

            column.Item().PaddingTop(2).LineHorizontal(0.8f).LineColor("#b91c1c");

            column.Item().PaddingTop(8).Background("#ffffff").PaddingVertical(8).PaddingHorizontal(6).Row(r =>
            {
                r.RelativeItem().Column(c =>
                {
                    c.Spacing(2);
                    c.Item().Text("Número de póliza").FontSize(8).SemiBold().FontColor("#64748b");
                    c.Item().Text(poliza.Numero).FontSize(10).SemiBold().FontColor("#0f172a");
                });
                r.RelativeItem().Column(c =>
                {
                    c.Spacing(2);
                    c.Item().Text("Código de reporte").FontSize(8).SemiBold().FontColor("#64748b");
                    c.Item().Text(reporteId).FontSize(9).FontColor("#334155");
                });
                r.RelativeItem().AlignRight().Column(c =>
                {
                    c.Spacing(2);
                    c.Item().AlignRight().Text("Fecha de generación").FontSize(8).SemiBold().FontColor("#64748b");
                    c.Item().AlignRight().Text(generadoTexto).FontSize(9).FontColor("#334155");
                });
            });
        });
    }

    private static void ComposeContent(IContainer container, PolizaRes poliza)
    {
        container.Column(column =>
        {
            column.Spacing(26);

            column.Item().Column(c =>
            {
                c.Spacing(12);
                c.Item().Element(x => SectionTitle(x, "1. Información general de la póliza"));
                c.Item().Element(x => GeneralTable(x, poliza));
            });

            column.Item().Column(c =>
            {
                c.Spacing(12);
                c.Item().Element(x => SectionTitle(x, "2. Historial de renovaciones"));
                c.Item().Element(x => EmptyOrMessage(x, true));
            });

            column.Item().Column(c =>
            {
                c.Spacing(12);
                c.Item().Element(x => SectionTitle(x, "3. Notificaciones enviadas"));
                c.Item().Element(x => EmptyOrMessage(x, false));
            });
        });
    }

    private static void SectionTitle(IContainer container, string title)
    {
        container.Column(col =>
        {
            col.Spacing(5);
            col.Item().Row(row =>
            {
                row.ConstantItem(4).Height(20).Background("#b91c1c");
                row.RelativeItem().PaddingLeft(8).Text(title)
                    .FontSize(12)
                    .SemiBold()
                    .FontColor("#0f172a");
            });
            col.Item().PaddingLeft(12).LineHorizontal(0.7f).LineColor("#e2e8f0");
        });
    }

    private static void GeneralTable(IContainer container, PolizaRes poliza)
    {
        var obs = string.IsNullOrWhiteSpace(poliza.Observaciones) ? "—" : poliza.Observaciones!;

        var rows = new (string Label, string Value)[]
        {
            ("Número de póliza", poliza.Numero),
            ("Contratista", poliza.ContratistaNombre),
            ("Obra / proyecto", poliza.Obra),
            ("Ramo", poliza.RamoNombre),
            ("Aseguradora", poliza.Aseguradora),
            ("Fecha de emisión", FechaCivil(poliza.FechaEmision)),
            ("Fecha de expiración", FechaCivil(poliza.FechaExpiracion)),
            ("Estado", EstadoTexto(poliza.Estado)),
            ("Valor original", Moneda(poliza.ValorOriginal)),
            ("Valor actual", Moneda(poliza.ValorActual)),
            ("Observaciones", obs),
        };

        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.ConstantColumn(170);
                columns.RelativeColumn();
            });

            var rowIndex = 0;
            foreach (var (label, value) in rows)
            {
                var bg = rowIndex % 2 == 0 ? "#ffffff" : "#fafbfd";
                table.Cell().Background(bg).BorderBottom(0.7f).BorderColor("#e2e8f0")
                    .PaddingVertical(8).PaddingRight(10).PaddingLeft(6)
                    .Text(label).FontSize(8.7f).FontColor("#64748b");
                table.Cell().Background(bg).BorderBottom(0.7f).BorderColor("#e2e8f0")
                    .PaddingVertical(8).PaddingHorizontal(8)
                    .Text(value).FontSize(9.4f).SemiBold().FontColor("#0f172a");
                rowIndex++;
            }
        });
    }

    private static void EmptyOrMessage(IContainer container, bool renovaciones)
    {
        var msg = renovaciones
            ? "No existen registros de renovaciones."
            : "No existen notificaciones registradas.";

        container
            .Background("#f8fafc")
            .Border(1)
            .BorderColor("#e2e8f0")
            .PaddingVertical(18)
            .PaddingHorizontal(14)
            .AlignCenter()
            .Column(col =>
            {
                col.Spacing(4);
                col.Item().Text("i").FontSize(14).SemiBold().FontColor("#94a3b8");
                col.Item().Text(msg).Italic().FontColor("#64748b").FontSize(9.3f);
                col.Item().Text("No existen registros disponibles").FontSize(8.2f).FontColor("#94a3b8");
            });
    }

    private static void ComposeFooter(IContainer container)
    {
        container.PaddingTop(12).Column(col =>
        {
            col.Item().LineHorizontal(0.7f).LineColor("#e2e8f0");
            col.Item().PaddingTop(6).Row(row =>
            {
                row.RelativeItem().Text($"{Sistema} · {Institucion}")
                    .FontSize(7.4f).FontColor("#94a3b8");
                row.RelativeItem().AlignRight().Text(t =>
                {
                    t.Span("Página ").FontSize(7.4f).FontColor("#94a3b8");
                    t.CurrentPageNumber().FontSize(7.4f).FontColor("#94a3b8");
                    t.Span(" de ").FontSize(7.4f).FontColor("#94a3b8");
                    t.TotalPages().FontSize(7.4f).FontColor("#94a3b8");
                });
            });
        });
    }

    private static string FechaCivil(DateTimeOffset dto) =>
        dto.ToOffset(OffsetColombia).ToString("dd/MM/yyyy", CultureInfo.GetCultureInfo("es-CO"));

    private static string Moneda(decimal valor) =>
        string.Format(CultureInfo.GetCultureInfo("es-CO"), "{0:C2}", valor);

    private static string EstadoTexto(EstadoPolizaDerivado e) => e switch
    {
        EstadoPolizaDerivado.Vigente => "Vigente",
        EstadoPolizaDerivado.PorVencer => "Por vencer",
        EstadoPolizaDerivado.Expirado => "Expirado",
        _ => e.ToString(),
    };
}
