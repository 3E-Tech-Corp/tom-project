namespace ProjectTemplate.Api.Models;

public class DressDesign
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string BaseStyle { get; set; } = "a-line";
    public string Customizations { get; set; } = "{}";
    public int? UserId { get; set; }
    public bool IsPreset { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class UserPhoto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateDressDesignRequest
{
    public string Name { get; set; } = string.Empty;
    public string BaseStyle { get; set; } = "a-line";
    public string Customizations { get; set; } = "{}";
    public string? ImageUrl { get; set; }
}

public class UpdateDressDesignRequest
{
    public string? Name { get; set; }
    public string? BaseStyle { get; set; }
    public string? Customizations { get; set; }
    public string? ImageUrl { get; set; }
}

public class DressDesignDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string BaseStyle { get; set; } = string.Empty;
    public string Customizations { get; set; } = "{}";
    public bool IsPreset { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ImageUploadResponse
{
    public string Url { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
}
