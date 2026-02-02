using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectTemplate.Api.Models;
using ProjectTemplate.Api.Services;

namespace ProjectTemplate.Api.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class SelectionsController : ControllerBase
{
    private readonly DressService _dressService;
    private readonly ILogger<SelectionsController> _logger;

    public SelectionsController(DressService dressService, ILogger<SelectionsController> logger)
    {
        _dressService = dressService;
        _logger = logger;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    public async Task<IActionResult> GetSelections()
    {
        var userId = GetUserId();
        var selections = await _dressService.GetUserSelectionsAsync(userId);
        return Ok(selections);
    }

    [HttpPost]
    public async Task<IActionResult> CreateSelection([FromBody] CreateSelectionRequest request)
    {
        try
        {
            var userId = GetUserId();
            var selection = await _dressService.CreateSelectionAsync(userId, request);
            _logger.LogInformation("User {UserId} added dress {DressId} to selections", userId, request.DressId);
            return Ok(selection);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSelection(int id)
    {
        var userId = GetUserId();
        var result = await _dressService.DeleteSelectionAsync(id, userId);
        if (!result) return NotFound(new { message = "Selection not found" });
        _logger.LogInformation("User {UserId} removed selection {Id}", userId, id);
        return Ok(new { message = "Selection removed" });
    }
}
