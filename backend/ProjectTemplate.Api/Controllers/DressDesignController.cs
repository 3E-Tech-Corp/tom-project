using System.Security.Claims;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using ProjectTemplate.Api.Models;

namespace ProjectTemplate.Api.Controllers;

[ApiController]
[Route("api/dress-designs")]
[Authorize]
public class DressDesignController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly ILogger<DressDesignController> _logger;

    public DressDesignController(IConfiguration config, ILogger<DressDesignController> logger)
    {
        _config = config;
        _logger = logger;
    }

    private SqlConnection CreateConnection() =>
        new(_config.GetConnectionString("DefaultConnection"));

    /// <summary>
    /// Get all preset dress designs + user's own custom designs
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        using var conn = CreateConnection();
        var designs = await conn.QueryAsync<DressDesignDto>(
            @"SELECT Id, Name, ImageUrl, BaseStyle, Customizations, IsPreset, CreatedAt 
              FROM DressDesigns 
              WHERE IsPreset = 1 OR UserId = @UserId
              ORDER BY IsPreset DESC, CreatedAt DESC",
            new { UserId = userId });
        return Ok(designs);
    }

    /// <summary>
    /// Get presets only (for gallery)
    /// </summary>
    [HttpGet("presets")]
    public async Task<IActionResult> GetPresets()
    {
        using var conn = CreateConnection();
        var designs = await conn.QueryAsync<DressDesignDto>(
            @"SELECT Id, Name, ImageUrl, BaseStyle, Customizations, IsPreset, CreatedAt 
              FROM DressDesigns 
              WHERE IsPreset = 1
              ORDER BY Name");
        return Ok(designs);
    }

    /// <summary>
    /// Get user's saved designs
    /// </summary>
    [HttpGet("my-designs")]
    public async Task<IActionResult> GetMyDesigns()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        using var conn = CreateConnection();
        var designs = await conn.QueryAsync<DressDesignDto>(
            @"SELECT Id, Name, ImageUrl, BaseStyle, Customizations, IsPreset, CreatedAt 
              FROM DressDesigns 
              WHERE UserId = @UserId AND IsPreset = 0
              ORDER BY CreatedAt DESC",
            new { UserId = userId });
        return Ok(designs);
    }

    /// <summary>
    /// Get single dress design
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        using var conn = CreateConnection();
        var design = await conn.QueryFirstOrDefaultAsync<DressDesignDto>(
            @"SELECT Id, Name, ImageUrl, BaseStyle, Customizations, IsPreset, CreatedAt 
              FROM DressDesigns 
              WHERE Id = @Id AND (IsPreset = 1 OR UserId = @UserId)",
            new { Id = id, UserId = userId });

        if (design == null) return NotFound(new { message = "Design not found" });
        return Ok(design);
    }

    /// <summary>
    /// Create a new dress design
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDressDesignRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        using var conn = CreateConnection();
        var id = await conn.QuerySingleAsync<int>(
            @"INSERT INTO DressDesigns (Name, ImageUrl, BaseStyle, Customizations, UserId, IsPreset)
              OUTPUT INSERTED.Id
              VALUES (@Name, @ImageUrl, @BaseStyle, @Customizations, @UserId, 0)",
            new { request.Name, request.ImageUrl, request.BaseStyle, request.Customizations, UserId = userId });

        _logger.LogInformation("Dress design {Id} created by user {UserId}", id, userId);
        return Ok(new { id, request.Name, request.BaseStyle, request.Customizations });
    }

    /// <summary>
    /// Update a dress design
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDressDesignRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        using var conn = CreateConnection();

        var existing = await conn.QueryFirstOrDefaultAsync<DressDesign>(
            "SELECT * FROM DressDesigns WHERE Id = @Id AND UserId = @UserId AND IsPreset = 0",
            new { Id = id, UserId = userId });

        if (existing == null) return NotFound(new { message = "Design not found or cannot edit presets" });

        await conn.ExecuteAsync(
            @"UPDATE DressDesigns SET
                Name = COALESCE(@Name, Name),
                BaseStyle = COALESCE(@BaseStyle, BaseStyle),
                Customizations = COALESCE(@Customizations, Customizations),
                ImageUrl = COALESCE(@ImageUrl, ImageUrl),
                UpdatedAt = GETUTCDATE()
              WHERE Id = @Id",
            new { request.Name, request.BaseStyle, request.Customizations, request.ImageUrl, Id = id });

        _logger.LogInformation("Dress design {Id} updated by user {UserId}", id, userId);
        return Ok(new { message = "Design updated" });
    }

    /// <summary>
    /// Delete a dress design
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        using var conn = CreateConnection();

        var rows = await conn.ExecuteAsync(
            "DELETE FROM DressDesigns WHERE Id = @Id AND UserId = @UserId AND IsPreset = 0",
            new { Id = id, UserId = userId });

        if (rows == 0) return NotFound(new { message = "Design not found or cannot delete presets" });

        _logger.LogInformation("Dress design {Id} deleted by user {UserId}", id, userId);
        return Ok(new { message = "Design deleted" });
    }
}
