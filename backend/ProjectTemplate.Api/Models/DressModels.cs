namespace ProjectTemplate.Api.Models;

public class RemoveBackgroundRequest
{
    public string ImageUrl { get; set; } = string.Empty;
}

public class Dress
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool InStock { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class DressCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class UserSelection
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int DressId { get; set; }
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    // Joined fields
    public string? DressName { get; set; }
    public string? DressImageUrl { get; set; }
    public decimal? DressPrice { get; set; }
    public string? DressCategory { get; set; }
    public string? DressSize { get; set; }
    public string? DressColor { get; set; }
}

public class CreateDressRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool InStock { get; set; } = true;
}

public class UpdateDressRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string? Category { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }
    public decimal? Price { get; set; }
    public bool? InStock { get; set; }
}

public class DressFilterRequest
{
    public string? Category { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? Search { get; set; }
    public bool? InStock { get; set; }
}

public class CreateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class CreateSelectionRequest
{
    public int DressId { get; set; }
    public string Notes { get; set; } = string.Empty;
}
