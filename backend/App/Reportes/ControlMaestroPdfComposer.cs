using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Globalization;
using Backend.App.Dtos;

namespace Backend.App.Reportes;

public static class ControlMaestroPdfComposer
{
    static ControlMaestroPdfComposer()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public static byte[] Generate(ControlMaestroRes data, DateTimeOffset generadoEn)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);

                page.Header().Text("REPORTE CONTROL MAESTRO")
                    .FontSize(18)
                    .SemiBold()
                    .AlignCenter();

                page.Content().PaddingVertical(10).Column(col =>
                {
                    col.Spacing(10);

                    col.Item().Text($"Fecha: {generadoEn:dd/MM/yyyy HH:mm}");

                    // =========================
                    // RESUMEN
                    // =========================
                    col.Item().Text("Resumen").SemiBold();

                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn();
                            c.RelativeColumn();
                        });

                        t.Cell().Text("Saldo inicial");
                        t.Cell().Text(Moneda(data.SaldoInicial));

                        t.Cell().Text("Total vigentes");
                        t.Cell().Text(Moneda(data.TotalVigentes));

                        t.Cell().Text("Total vencidas");
                        t.Cell().Text(Moneda(data.TotalVencidas));

                        t.Cell().Text("Cuadre total").SemiBold();
                        t.Cell().Text(Moneda(data.CuadreTotal)).SemiBold();
                    });

                    // =========================
                    // VIGENTES
                    // =========================
                    col.Item().PaddingTop(10).Text("Pólizas Vigentes").SemiBold();

                    col.Item().Element(c => TablaPolizas(c, data.Vigentes.Items));

                    // =========================
                    // VENCIDAS
                    // =========================
                    col.Item().PaddingTop(10).Text("Pólizas Vencidas").SemiBold();

                    col.Item().Element(c => TablaPolizas(c, data.Vencidas.Items));
                });

                page.Footer()
                    .AlignCenter()
                    .Text(t =>
                    {
                        t.Span("Página ");
                        t.CurrentPageNumber();
                        t.Span(" de ");
                        t.TotalPages();
                    });
            });
        }).GeneratePdf();
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
                h.Cell().Text("Número").SemiBold();
                h.Cell().Text("Obra").SemiBold();
                h.Cell().Text("Contratista").SemiBold();
                h.Cell().Text("Valor").SemiBold();
            });

            foreach (var p in items)
            {
                table.Cell().Text(p.Numero);
                table.Cell().Text(p.Obra);
                table.Cell().Text(p.ContratistaNombre);
                table.Cell().Text(Moneda(p.ValorActual));
            }
        });
    }

    private static string Moneda(decimal value)
    {
        return string.Format(
            CultureInfo.GetCultureInfo("es-EC"),
            "{0:C2}",
            value
        );
    }
}