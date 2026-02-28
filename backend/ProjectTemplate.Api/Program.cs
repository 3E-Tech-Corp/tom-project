using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ProjectTemplate.Api.Services;
using Dapper;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ProjectTemplate API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ProjectTemplate";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ProjectTemplate";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// CORS
var corsOrigins = builder.Configuration["Cors:Origins"]?.Split(',', StringSplitOptions.RemoveEmptyEntries) ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Register services
builder.Services.AddHttpClient("FalAi", client =>
{
    client.Timeout = TimeSpan.FromSeconds(60);
});
builder.Services.AddHttpClient();
builder.Services.AddSingleton<AuthService>();
builder.Services.AddSingleton<DressService>();
builder.Services.AddSingleton<BackgroundRemovalService>();

var app = builder.Build();

// Ensure uploads directory exists
var uploadsPath = Path.Combine(app.Environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
Directory.CreateDirectory(Path.Combine(uploadsPath, "dresses"));
Directory.CreateDirectory(Path.Combine(uploadsPath, "user-photos"));

// Auto-migration: ensure tables exist
using (var scope = app.Services.CreateScope())
{
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var connStr = config.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrEmpty(connStr))
    {
        try
        {
            using var conn = new SqlConnection(connStr);
            await conn.OpenAsync();

            // Users table
            await conn.ExecuteAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
                BEGIN
                    CREATE TABLE Users (
                        Id INT IDENTITY(1,1) PRIMARY KEY,
                        Username NVARCHAR(100) NOT NULL UNIQUE,
                        Email NVARCHAR(255) NOT NULL,
                        PasswordHash NVARCHAR(500) NOT NULL,
                        Role NVARCHAR(50) NOT NULL DEFAULT 'User',
                        IsActive BIT NOT NULL DEFAULT 1,
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        UpdatedAt DATETIME2 NULL
                    );
                END");

            // DressCategories table
            await conn.ExecuteAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DressCategories')
                BEGIN
                    CREATE TABLE DressCategories (
                        Id INT IDENTITY(1,1) PRIMARY KEY,
                        Name NVARCHAR(100) NOT NULL UNIQUE,
                        Description NVARCHAR(500) NOT NULL DEFAULT '',
                        SortOrder INT NOT NULL DEFAULT 0
                    );

                    -- Seed categories
                    INSERT INTO DressCategories (Name, Description, SortOrder) VALUES
                        ('Evening', 'Elegant evening and gala dresses', 1),
                        ('Casual', 'Comfortable everyday dresses', 2),
                        ('Wedding', 'Bridal and wedding guest dresses', 3),
                        ('Cocktail', 'Chic cocktail party dresses', 4),
                        ('Summer', 'Light and breezy summer dresses', 5),
                        ('Formal', 'Professional and formal occasion dresses', 6);
                END");

            // Dresses table
            await conn.ExecuteAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Dresses')
                BEGIN
                    CREATE TABLE Dresses (
                        Id INT IDENTITY(1,1) PRIMARY KEY,
                        Name NVARCHAR(200) NOT NULL,
                        Description NVARCHAR(2000) NOT NULL DEFAULT '',
                        ImageUrl NVARCHAR(500) NOT NULL DEFAULT '',
                        Category NVARCHAR(100) NOT NULL DEFAULT '',
                        Size NVARCHAR(20) NOT NULL DEFAULT '',
                        Color NVARCHAR(50) NOT NULL DEFAULT '',
                        Price DECIMAL(10,2) NOT NULL DEFAULT 0,
                        InStock BIT NOT NULL DEFAULT 1,
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        UpdatedAt DATETIME2 NULL
                    );
                END");

            // UserSelections table
            await conn.ExecuteAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserSelections')
                BEGIN
                    CREATE TABLE UserSelections (
                        Id INT IDENTITY(1,1) PRIMARY KEY,
                        UserId INT NOT NULL,
                        DressId INT NOT NULL,
                        Notes NVARCHAR(500) NOT NULL DEFAULT '',
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        CONSTRAINT FK_UserSelections_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
                        CONSTRAINT FK_UserSelections_Dresses FOREIGN KEY (DressId) REFERENCES Dresses(Id) ON DELETE CASCADE,
                        CONSTRAINT UQ_UserSelections_UserDress UNIQUE (UserId, DressId)
                    );
                END");

            // DressDesigns table (custom design studio)
            await conn.ExecuteAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DressDesigns')
                BEGIN
                    CREATE TABLE DressDesigns (
                        Id INT IDENTITY(1,1) PRIMARY KEY,
                        Name NVARCHAR(200) NOT NULL,
                        ImageUrl NVARCHAR(500) NULL,
                        BaseStyle NVARCHAR(50) NOT NULL DEFAULT 'a-line',
                        Customizations NVARCHAR(MAX) NOT NULL DEFAULT '{}',
                        UserId INT NULL,
                        IsPreset BIT NOT NULL DEFAULT 0,
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        UpdatedAt DATETIME2 NULL,
                        CONSTRAINT FK_DressDesigns_Users FOREIGN KEY (UserId) REFERENCES Users(Id)
                    );

                    -- Seed preset dress designs
                    INSERT INTO DressDesigns (Name, BaseStyle, Customizations, IsPreset) VALUES
                    ('Classic A-Line', 'a-line', '{""length"":75,""strapType"":""thick"",""backStyle"":""closed"",""color"":""#1a1a2e"",""neckline"":""sweetheart""}', 1),
                    ('Summer Sundress', 'a-line', '{""length"":55,""strapType"":""spaghetti"",""backStyle"":""open"",""color"":""#e8d5b7"",""neckline"":""v-neck""}', 1),
                    ('Evening Gown', 'mermaid', '{""length"":100,""strapType"":""strapless"",""backStyle"":""low-cut"",""color"":""#722f37"",""neckline"":""sweetheart""}', 1),
                    ('Cocktail Dress', 'fit-flare', '{""length"":50,""strapType"":""off-shoulder"",""backStyle"":""closed"",""color"":""#2d3436"",""neckline"":""off-shoulder""}', 1),
                    ('Garden Party', 'a-line', '{""length"":65,""strapType"":""halter"",""backStyle"":""open"",""color"":""#a8e6cf"",""neckline"":""halter""}', 1),
                    ('Elegant Maxi', 'empire', '{""length"":95,""strapType"":""thick"",""backStyle"":""cross"",""color"":""#dfe6e9"",""neckline"":""scoop""}', 1);
                END");

            // UserPhotos table (virtual try-on)
            await conn.ExecuteAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserPhotos')
                BEGIN
                    CREATE TABLE UserPhotos (
                        Id INT IDENTITY(1,1) PRIMARY KEY,
                        UserId INT NOT NULL,
                        ImageUrl NVARCHAR(500) NOT NULL,
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        CONSTRAINT FK_UserPhotos_Users FOREIGN KEY (UserId) REFERENCES Users(Id)
                    );
                END");

            app.Logger.LogInformation("Database migration completed successfully");
        }
        catch (Exception ex)
        {
            app.Logger.LogWarning(ex, "Database migration failed - will retry on first request");
        }
    }
}

// Middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
