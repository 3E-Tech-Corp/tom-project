using Dapper;
using Microsoft.Data.SqlClient;
using ProjectTemplate.Api.Models;

namespace ProjectTemplate.Api.Services;

public class DressService
{
    private readonly IConfiguration _config;
    private readonly ILogger<DressService> _logger;

    public DressService(IConfiguration config, ILogger<DressService> logger)
    {
        _config = config;
        _logger = logger;
    }

    private SqlConnection CreateConnection() =>
        new(_config.GetConnectionString("DefaultConnection"));

    // --- Dresses ---

    public async Task<IEnumerable<Dress>> GetDressesAsync(DressFilterRequest filter)
    {
        using var conn = CreateConnection();
        var sql = "SELECT * FROM Dresses WHERE 1=1";
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(filter.Category))
        {
            sql += " AND Category = @Category";
            parameters.Add("Category", filter.Category);
        }

        if (!string.IsNullOrWhiteSpace(filter.Size))
        {
            sql += " AND Size = @Size";
            parameters.Add("Size", filter.Size);
        }

        if (!string.IsNullOrWhiteSpace(filter.Color))
        {
            sql += " AND Color = @Color";
            parameters.Add("Color", filter.Color);
        }

        if (filter.MinPrice.HasValue)
        {
            sql += " AND Price >= @MinPrice";
            parameters.Add("MinPrice", filter.MinPrice.Value);
        }

        if (filter.MaxPrice.HasValue)
        {
            sql += " AND Price <= @MaxPrice";
            parameters.Add("MaxPrice", filter.MaxPrice.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            sql += " AND (Name LIKE @Search OR Description LIKE @Search)";
            parameters.Add("Search", $"%{filter.Search}%");
        }

        if (filter.InStock.HasValue)
        {
            sql += " AND InStock = @InStock";
            parameters.Add("InStock", filter.InStock.Value);
        }

        sql += " ORDER BY CreatedAt DESC";

        return await conn.QueryAsync<Dress>(sql, parameters);
    }

    public async Task<Dress?> GetDressByIdAsync(int id)
    {
        using var conn = CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<Dress>(
            "SELECT * FROM Dresses WHERE Id = @Id", new { Id = id });
    }

    public async Task<Dress> CreateDressAsync(CreateDressRequest request)
    {
        using var conn = CreateConnection();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO Dresses (Name, Description, ImageUrl, Category, Size, Color, Price, InStock)
            OUTPUT INSERTED.Id
            VALUES (@Name, @Description, @ImageUrl, @Category, @Size, @Color, @Price, @InStock)",
            request);

        return (await GetDressByIdAsync(id))!;
    }

    public async Task<Dress?> UpdateDressAsync(int id, UpdateDressRequest request)
    {
        using var conn = CreateConnection();
        var existing = await conn.QueryFirstOrDefaultAsync<Dress>(
            "SELECT * FROM Dresses WHERE Id = @Id", new { Id = id });

        if (existing == null) return null;

        await conn.ExecuteAsync(@"
            UPDATE Dresses SET
                Name = @Name,
                Description = @Description,
                ImageUrl = @ImageUrl,
                Category = @Category,
                Size = @Size,
                Color = @Color,
                Price = @Price,
                InStock = @InStock,
                UpdatedAt = GETUTCDATE()
            WHERE Id = @Id",
            new
            {
                Id = id,
                Name = request.Name ?? existing.Name,
                Description = request.Description ?? existing.Description,
                ImageUrl = request.ImageUrl ?? existing.ImageUrl,
                Category = request.Category ?? existing.Category,
                Size = request.Size ?? existing.Size,
                Color = request.Color ?? existing.Color,
                Price = request.Price ?? existing.Price,
                InStock = request.InStock ?? existing.InStock
            });

        return await GetDressByIdAsync(id);
    }

    public async Task<bool> DeleteDressAsync(int id)
    {
        using var conn = CreateConnection();
        var rows = await conn.ExecuteAsync("DELETE FROM Dresses WHERE Id = @Id", new { Id = id });
        return rows > 0;
    }

    // --- Categories ---

    public async Task<IEnumerable<DressCategory>> GetCategoriesAsync()
    {
        using var conn = CreateConnection();
        return await conn.QueryAsync<DressCategory>(
            "SELECT * FROM DressCategories ORDER BY SortOrder, Name");
    }

    public async Task<DressCategory> CreateCategoryAsync(CreateCategoryRequest request)
    {
        using var conn = CreateConnection();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO DressCategories (Name, Description, SortOrder)
            OUTPUT INSERTED.Id
            VALUES (@Name, @Description, @SortOrder)",
            request);

        return await conn.QueryFirstAsync<DressCategory>(
            "SELECT * FROM DressCategories WHERE Id = @Id", new { Id = id });
    }

    // --- User Selections ---

    public async Task<IEnumerable<UserSelection>> GetUserSelectionsAsync(int userId)
    {
        using var conn = CreateConnection();
        return await conn.QueryAsync<UserSelection>(@"
            SELECT s.Id, s.UserId, s.DressId, s.Notes, s.CreatedAt,
                   d.Name AS DressName, d.ImageUrl AS DressImageUrl,
                   d.Price AS DressPrice, d.Category AS DressCategory,
                   d.Size AS DressSize, d.Color AS DressColor
            FROM UserSelections s
            INNER JOIN Dresses d ON s.DressId = d.Id
            WHERE s.UserId = @UserId
            ORDER BY s.CreatedAt DESC",
            new { UserId = userId });
    }

    public async Task<UserSelection> CreateSelectionAsync(int userId, CreateSelectionRequest request)
    {
        using var conn = CreateConnection();

        // Check if already selected
        var existing = await conn.QueryFirstOrDefaultAsync<UserSelection>(
            "SELECT * FROM UserSelections WHERE UserId = @UserId AND DressId = @DressId",
            new { UserId = userId, DressId = request.DressId });

        if (existing != null)
            throw new InvalidOperationException("Dress already in your selections");

        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO UserSelections (UserId, DressId, Notes)
            OUTPUT INSERTED.Id
            VALUES (@UserId, @DressId, @Notes)",
            new { UserId = userId, DressId = request.DressId, Notes = request.Notes });

        var selections = await GetUserSelectionsAsync(userId);
        return selections.First(s => s.Id == id);
    }

    public async Task<bool> DeleteSelectionAsync(int id, int userId)
    {
        using var conn = CreateConnection();
        var rows = await conn.ExecuteAsync(
            "DELETE FROM UserSelections WHERE Id = @Id AND UserId = @UserId",
            new { Id = id, UserId = userId });
        return rows > 0;
    }
}
