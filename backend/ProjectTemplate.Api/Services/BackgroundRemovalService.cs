using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace ProjectTemplate.Api.Services;

public class BackgroundRemovalService
{
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<BackgroundRemovalService> _logger;
    private readonly HttpClient _httpClient;

    public BackgroundRemovalService(
        IConfiguration config,
        IWebHostEnvironment env,
        ILogger<BackgroundRemovalService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _config = config;
        _env = env;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient("FalAi");
    }

    public async Task<string?> RemoveBackgroundAsync(string imageUrl)
    {
        var falKey = _config["Fal:Key"];
        if (string.IsNullOrEmpty(falKey))
        {
            _logger.LogWarning("FAL API key not configured");
            return null;
        }

        try
        {
            // Call FAL.ai birefnet background removal
            var request = new HttpRequestMessage(HttpMethod.Post, "https://fal.run/fal-ai/birefnet");
            request.Headers.Authorization = new AuthenticationHeaderValue("Key", falKey);
            request.Content = new StringContent(
                JsonSerializer.Serialize(new { image_url = imageUrl }),
                Encoding.UTF8,
                "application/json");

            _logger.LogInformation("Calling FAL.ai background removal for: {Url}", imageUrl);
            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogError("FAL.ai returned {Status}: {Body}", response.StatusCode, errorBody);
                return null;
            }

            var resultJson = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("FAL.ai response: {Json}", resultJson);

            using var doc = JsonDocument.Parse(resultJson);
            var root = doc.RootElement;

            // FAL birefnet returns { "image": { "url": "...", "content_type": "...", ... } }
            if (!root.TryGetProperty("image", out var imageObj) ||
                !imageObj.TryGetProperty("url", out var resultUrlProp))
            {
                _logger.LogError("Unexpected FAL.ai response structure");
                return null;
            }

            var resultUrl = resultUrlProp.GetString();
            if (string.IsNullOrEmpty(resultUrl))
                return null;

            // Download the processed image and save locally
            var imageResponse = await _httpClient.GetAsync(resultUrl);
            if (!imageResponse.IsSuccessStatusCode)
            {
                _logger.LogError("Failed to download processed image from FAL.ai");
                return null;
            }

            var imageBytes = await imageResponse.Content.ReadAsByteArrayAsync();
            var uploadsDir = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", "processed");
            Directory.CreateDirectory(uploadsDir);

            var fileName = $"{Guid.NewGuid()}.png";
            var filePath = Path.Combine(uploadsDir, fileName);
            await File.WriteAllBytesAsync(filePath, imageBytes);

            var localUrl = $"/uploads/processed/{fileName}";
            _logger.LogInformation("Background removed, saved to: {Url}", localUrl);
            return localUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Background removal failed for: {Url}", imageUrl);
            return null;
        }
    }
}
