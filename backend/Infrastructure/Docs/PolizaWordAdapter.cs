using Backend.Domain.Models;

namespace Backend.Infrastructure.Docs;

public class PolizaWordAdapter
{
    public static Dictionary<string, string> Map(PolizaDocumentoDto p)
    {
        return new Dictionary<string, string>
        {
            { "OFICIO_NUMERO", "400-TP-2026" }, // Valor magico
            { "FECHA_DOCUMENTO", DateTime.Today.ToString("dd 'de' MMMM 'del' yyyy")},
            { "ASEGURADORA", p.Aseguradora },
            { "OBRA", p.Obra },
            { "CONTRATISTA", p.Contratista },
            { "POLIZA_NUMERO", p.NumeroPoliza},
            { "FECHA_RENOVACION_POLIZA", p.FechaRenovacion.ToString("dd 'de' MMMM 'del' yyyy")},
            { "VALOR", p.Valor.ToString("C") },
            { "FECHA_EXPIRACION_POLIZA", p.FechaExpiracion.ToString("dd 'de' MMMM 'del' yyyy") }
        };
    }
}