using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Globalization;
using Backend.App.Dtos;

namespace Backend.App.Reportes;

public static class ControlMaestroPdfComposer
{
    private static readonly TimeSpan OffsetColombia = TimeSpan.FromHours(-5);

    private const string Institucion = "Gobierno Provincial de Tungurahua";
    private const string Sistema = "SICOP";

    static ControlMaestroPdfComposer()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public static byte[] Generate(ControlMaestroRes data, DateTimeOffset generadoEn, string? logoPath, string reporteCodigo)
    {
        var generadoTexto = generadoEn.ToOffset(OffsetColombia)
            .ToString("dd/MM/yyyy HH:mm", CultureInfo.GetCultureInfo("es-CO"));

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(10).FontColor("#334155").LineHeight(1.25f));

                page.Header().Element(h => ComposeHeaderMaestro(h, logoPath, reporteCodigo, generadoTexto));

                page.Content().PaddingVertical(10).Column(col =>
                {
                    col.Spacing(18);

                    // Cuadre / resumen — mismo patrón que "Información general" del PDF individual
                    col.Item().Element(c =>
                    {
                        c.Column(section =>
                        {
                            section.Spacing(12);
                            section.Item().Element(x => SectionTitle(x, "Resumen"));
                            section.Item().Element(x => CuadreResumenTable(x, data));
                        });
                    });

                    col.Item().Element(c =>
                    {
                        c.Column(section =>
                        {
                            section.Spacing(12);
                            section.Item().Element(x => SectionTitle(x, "Pólizas vigentes"));
                            section.Item().Element(inner => TablaPolizas(inner, data.Vigentes.Items));
                        });
                    });

                    col.Item().Element(c =>
                    {
                        c.Column(section =>
                        {
                            section.Spacing(12);
                            section.Item().Element(x => SectionTitle(x, "Pólizas vencidas"));
                            section.Item().Element(inner => TablaPolizas(inner, data.Vencidas.Items));
                        });
                    });
                });

                page.Footer().Element(ComposeFooterMaestro);
            });
        }).GeneratePdf();
    }

    /// <summary>Misma línea visual que el PDF individual de póliza (logo, marca, título, línea roja, metadatos).</summary>
    private static void ComposeHeaderMaestro(
        IContainer container,
        string? logoPath,
        string reporteCodigo,
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
                    right.Item().PaddingTop(5).Text("Reporte control maestro")
                        .FontSize(18).SemiBold().FontColor("#0f172a");
                    right.Item().Text("Consolidado de pólizas vigentes y vencidas")
                        .FontSize(9).FontColor("#64748b");
                });
            });

            column.Item().PaddingTop(2).LineHorizontal(0.8f).LineColor("#b91c1c");

            column.Item().PaddingTop(8).Background("#ffffff").PaddingVertical(8).PaddingHorizontal(6).Row(r =>
            {
                r.RelativeItem().Column(c =>
                {
                    c.Spacing(2);
                    c.Item().Text("Documento").FontSize(8).SemiBold().FontColor("#64748b");
                    c.Item().Text("Control maestro consolidado").FontSize(10).SemiBold().FontColor("#0f172a");
                });
                r.RelativeItem().Column(c =>
                {
                    c.Spacing(2);
                    c.Item().Text("Código de reporte").FontSize(8).SemiBold().FontColor("#64748b");
                    c.Item().Text(reporteCodigo).FontSize(9).FontColor("#334155");
                });
                r.RelativeItem().AlignRight().Column(c =>
                {
                    c.Spacing(2);
                    c.Item().AlignRight().Text("Fecha de generación").FontSize(8).SemiBold().FontColor("#64748b");
                    c.Item().AlignRight().Text(generadoTexto).FontSize(9).FontColor("#334155");
                });
            });

            column.Item().PaddingTop(6).LineHorizontal(0.7f).LineColor("#e2e8f0");
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

    private static void CuadreResumenTable(IContainer container, ControlMaestroRes data)
    {
        // Etiquetas alineadas con la barra de resumen en pantalla (Control Maestro).
        var rows = new (string Label, string Value)[]
        {
            ("Saldo inicial", Moneda(data.SaldoInicial)),
            ("Vigentes", Moneda(data.TotalVigentes)),
            ("Vencidas", Moneda(data.TotalVencidas)),
            ("Cuadre total", Moneda(data.CuadreTotal)),
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
                    .AlignRight()
                    .Text(value).FontSize(9.4f).SemiBold().FontColor("#0f172a");
                rowIndex++;
            }
        });
    }

    private static void ComposeFooterMaestro(IContainer container)
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

    private static void TablaPolizas(IContainer container, IEnumerable<PolizaRes> items)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(c =>
            {
                c.RelativeColumn(2); // Número
                c.RelativeColumn(3); // Obra
                c.RelativeColumn(2); // Contratista
                c.RelativeColumn(2); // Valor
            });

            // Header
            table.Header(h =>
            {
                h.Cell().Background("#f1f5f9").BorderBottom(0.7f).BorderColor("#e2e8f0")
                    .PaddingVertical(6).PaddingHorizontal(6).Text("Número").FontSize(8.5f).SemiBold().FontColor("#475569");
                h.Cell().Background("#f1f5f9").BorderBottom(0.7f).BorderColor("#e2e8f0")
                    .PaddingVertical(6).PaddingHorizontal(6).Text("Obra").FontSize(8.5f).SemiBold().FontColor("#475569");
                h.Cell().Background("#f1f5f9").BorderBottom(0.7f).BorderColor("#e2e8f0")
                    .PaddingVertical(6).PaddingHorizontal(6).Text("Contratista").FontSize(8.5f).SemiBold().FontColor("#475569");
                h.Cell().Background("#f1f5f9").BorderBottom(0.7f).BorderColor("#e2e8f0")
                    .PaddingVertical(6).PaddingHorizontal(6).AlignRight().Text("Valor").FontSize(8.5f).SemiBold().FontColor("#475569");
            });

            var i = 0;
            foreach (var p in items)
            {
                var bg = i % 2 == 0 ? "#ffffff" : "#fafbfd";
                table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#f1f5f9").PaddingVertical(6).PaddingHorizontal(6).Text(p.Numero).FontSize(9).FontColor("#334155");
                table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#f1f5f9").PaddingVertical(6).PaddingHorizontal(6).Text(p.Obra).FontSize(9).FontColor("#334155");
                table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#f1f5f9").PaddingVertical(6).PaddingHorizontal(6).Text(p.ContratistaNombre).FontSize(9).FontColor("#334155");
                table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#f1f5f9").PaddingVertical(6).PaddingHorizontal(6).AlignRight()
                    .Text(Moneda(p.ValorActual)).FontSize(9).SemiBold().FontColor("#0f172a");
                i++;
            }
        });
    }

    private static string Moneda(decimal value)
    {
        return string.Format(
            CultureInfo.GetCultureInfo("es-CO"),
            "{0:C2}",
            value
        );
    }
}