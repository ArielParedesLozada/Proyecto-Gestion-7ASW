using System.Security.Cryptography;

namespace Backend.Infrastructure.Security;

public class KeyLoader
{
    public static RSA LoadRsaKey(string rsaKeyPath)
    {
        var rsa = RSA.Create();
        if (!File.Exists(rsaKeyPath))
        {
            throw new FileNotFoundException("RSA key file not found", rsaKeyPath);
        }
        var pemContents = File.ReadAllText(rsaKeyPath);
        rsa.ImportFromPem(pemContents.ToCharArray());

        return rsa;
    }
}