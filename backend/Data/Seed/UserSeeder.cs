using Backend.Data.Databases;
using Backend.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data.Seed;

public static class UserSeeder
{
    public static async Task SeedAsync(AppDatabase db, string password)
    {
        var adminExists = await db.Users.AnyAsync(u => u.Username == "adminpapu");
        if (adminExists)
        {
            return;
        }
        var admin = new User("adminpapu", BCrypt.Net.BCrypt.HashPassword(password ?? "Admin@123"), "ADMIN")
        {
            MustChangePassword = true
        };
        await db.Users.AddAsync(admin);
        await db.SaveChangesAsync();
    }
}