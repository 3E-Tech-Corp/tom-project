using System.Security.Claims;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using ProjectTemplate.Api.Models;

namespace ProjectTemplate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImageController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<ImageController> _logger;
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    public ImageController(IConfiguration config, IWebHostEnvironment env, ILogger<ImageController> logger)
    {
        _config = config;
        _env = env;
        _logger = logger;
    }

    private SqlConnection CreateConnection() =>
        new(_config.GetConnectionString("DefaultConnection"));

    /// <summary>
    /// Upload a dress image
    /// </summary>
    [HttpPost("dress")]
    [Authorize]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<IActionResult> UploadDressImage(IFormFile file)
    {
        var result = await SaveFile(file, "dresses");
        if (result == null) return BadRequest(new { message = "Invalid file. Allowed: jpg, jpeg, png, gif, webp. Max 10MB." });
        return Ok(result);
    }

    /// <summary>
    /// Upload a user photo for virtual try-on
    /// </summary>
    [HttpPost("user-photo")]
    [Authorize]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<IActionResult> UploadUserPhoto(IFormFile file)
    {
        var result = await SaveFile(file, "user-photos");
        if (result == null) return BadRequest(new { message = "Invalid file. Allowed: jpg, jpeg, png, gif, webp. Max 10MB." });

        // Save reference in DB
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            @"INSERT INTO UserPhotos (UserId, ImageUrl, CreatedAt) 
              VALUES (@UserId, @ImageUrl, GETUTCDATE())",
            new { UserId = userId, ImageUrl = result.Url });

        _logger.LogInformation("User photo uploaded by user {UserId}: {Url}", userId, result.Url);
        return Ok(result);
    }

    /// <summary>
    /// Get user's uploaded photos
    /// </summary>
    [HttpGet("user-photos")]
    [Authorize]
    public async Task<IActionResult> GetUserPhotos()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        using var conn = CreateConnection();
        var photos = await conn.QueryAsync<UserPhoto>(
            "SELECT Id, UserId, ImageUrl, CreatedAt FROM UserPhotos WHERE UserId = @UserId ORDER BY CreatedAt DESC",
            new { UserId = userId });
        return Ok(photos);
    }

    /// <summary>
    /// Delete a user photo
    /// </summary>
    [HttpDelete("user-photos/{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteUserPhoto(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        using var conn = CreateConnection();

        var photo = await conn.QueryFirstOrDefaultAsync<UserPhoto>(
            "SELECT * FROM UserPhotos WHERE Id = @Id AND UserId = @UserId",
            new { Id = id, UserId = userId });

        if (photo == null) return NotFound(new { message = "Photo not found" });

        // Delete file from disk
        if (!string.IsNullOrEmpty(photo.ImageUrl))
        {
            var filePath = Path.Combine(_env.WebRootPath ?? "wwwroot", photo.ImageUrl.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }

        await conn.ExecuteAsync("DELETE FROM UserPhotos WHERE Id = @Id", new { Id = id });
        _logger.LogInformation("User photo {Id} deleted by user {UserId}", id, userId);
        return Ok(new { message = "Photo deleted" });
    }

    private async Task<ImageUploadResponse?> SaveFile(IFormFile? file, string subfolder)
    {
        if (file == null || file.Length == 0 || file.Length > MaxFileSize)
            return null;

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return null;

        var uploadsDir = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", subfolder);
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        var url = $"/uploads/{subfolder}/{fileName}";
        _logger.LogInformation("File uploaded: {Url}", url);

        return new ImageUploadResponse { Url = url, FileName = fileName };
    }
}
