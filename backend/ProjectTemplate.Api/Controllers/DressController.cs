using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectTemplate.Api.Models;
using ProjectTemplate.Api.Services;

namespace ProjectTemplate.Api.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class DressesController : ControllerBase
{
    private readonly DressService _dressService;
    private readonly ILogger<DressesController> _logger;

    public DressesController(DressService dressService, ILogger<DressesController> logger)
    {
        _dressService = dressService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetDresses(
        [FromQuery] string? category,
        [FromQuery] string? size,
        [FromQuery] string? color,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] string? search,
        [FromQuery] bool? inStock)
    {
        var filter = new DressFilterRequest
        {
            Category = category,
            Size = size,
            Color = color,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            Search = search,
            InStock = inStock
        };

        var dresses = await _dressService.GetDressesAsync(filter);
        return Ok(dresses);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDress(int id)
    {
        var dress = await _dressService.GetDressByIdAsync(id);
        if (dress == null) return NotFound(new { message = "Dress not found" });
        return Ok(dress);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateDress([FromBody] CreateDressRequest request)
    {
        var dress = await _dressService.CreateDressAsync(request);
        _logger.LogInformation("Dress '{Name}' created by {User}", dress.Name, User.Identity?.Name);
        return Ok(dress);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateDress(int id, [FromBody] UpdateDressRequest request)
    {
        var dress = await _dressService.UpdateDressAsync(id, request);
        if (dress == null) return NotFound(new { message = "Dress not found" });
        _logger.LogInformation("Dress '{Name}' updated by {User}", dress.Name, User.Identity?.Name);
        return Ok(dress);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteDress(int id)
    {
        var result = await _dressService.DeleteDressAsync(id);
        if (!result) return NotFound(new { message = "Dress not found" });
        _logger.LogInformation("Dress {Id} deleted by {User}", id, User.Identity?.Name);
        return Ok(new { message = "Dress deleted" });
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _dressService.GetCategoriesAsync();
        return Ok(categories);
    }

    [HttpPost("categories")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
    {
        var category = await _dressService.CreateCategoryAsync(request);
        _logger.LogInformation("Category '{Name}' created by {User}", category.Name, User.Identity?.Name);
        return Ok(category);
    }
}
