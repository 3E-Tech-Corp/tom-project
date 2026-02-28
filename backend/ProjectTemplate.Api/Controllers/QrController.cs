using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QRCoder;
using SkiaSharp;

namespace ProjectTemplate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QrController : ControllerBase
{
    private readonly ILogger<QrController> _logger;
    private readonly HttpClient _httpClient;

    public QrController(ILogger<QrController> logger, IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();
    }

    public class QrRequest
    {
        public string Url { get; set; } = string.Empty;
        public int Size { get; set; } = 300;
        public string? LogoUrl { get; set; }
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] QrRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Url))
            return BadRequest(new { message = "URL is required" });

        if (request.Size < 100 || request.Size > 1000)
            return BadRequest(new { message = "Size must be between 100 and 1000" });

        try
        {
            using var qrGenerator = new QRCodeGenerator();
            var qrCodeData = qrGenerator.CreateQrCode(request.Url, QRCodeGenerator.ECCLevel.H);
            
            using var qrCode = new PngByteQRCode(qrCodeData);
            var qrBytes = qrCode.GetGraphic(20);
            
            // If logo URL provided, overlay it on the QR code
            if (!string.IsNullOrWhiteSpace(request.LogoUrl))
            {
                try
                {
                    var logoBytes = await _httpClient.GetByteArrayAsync(request.LogoUrl);
                    qrBytes = OverlayLogo(qrBytes, logoBytes);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to fetch logo from {LogoUrl}", request.LogoUrl);
                    // Continue without logo
                }
            }
            
            // Resize to requested size
            qrBytes = ResizeImage(qrBytes, request.Size);
            
            var base64 = Convert.ToBase64String(qrBytes);
            return Ok(new { 
                image = $"data:image/png;base64,{base64}",
                size = request.Size
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate QR code for {Url}", request.Url);
            return StatusCode(500, new { message = "Failed to generate QR code" });
        }
    }

    private byte[] ResizeImage(byte[] imageBytes, int size)
    {
        using var inputStream = new MemoryStream(imageBytes);
        using var original = SKBitmap.Decode(inputStream);
        using var resized = original.Resize(new SKImageInfo(size, size), SKFilterQuality.High);
        using var image = SKImage.FromBitmap(resized);
        using var data = image.Encode(SKEncodedImageFormat.Png, 100);
        return data.ToArray();
    }

    private byte[] OverlayLogo(byte[] qrBytes, byte[] logoBytes)
    {
        using var qrStream = new MemoryStream(qrBytes);
        using var logoStream = new MemoryStream(logoBytes);
        using var qrBitmap = SKBitmap.Decode(qrStream);
        using var logoBitmap = SKBitmap.Decode(logoStream);
        
        if (logoBitmap == null)
            return qrBytes;
        
        // Logo should be about 20% of QR code size
        int logoSize = (int)(qrBitmap.Width * 0.2);
        int x = (qrBitmap.Width - logoSize) / 2;
        int y = (qrBitmap.Height - logoSize) / 2;
        
        using var surface = SKSurface.Create(new SKImageInfo(qrBitmap.Width, qrBitmap.Height));
        var canvas = surface.Canvas;
        
        // Draw QR code
        canvas.DrawBitmap(qrBitmap, 0, 0);
        
        // Draw white background for logo
        using var whitePaint = new SKPaint { Color = SKColors.White };
        canvas.DrawRect(x - 5, y - 5, logoSize + 10, logoSize + 10, whitePaint);
        
        // Resize and draw logo
        using var resizedLogo = logoBitmap.Resize(new SKImageInfo(logoSize, logoSize), SKFilterQuality.High);
        canvas.DrawBitmap(resizedLogo, x, y);
        
        using var image = surface.Snapshot();
        using var data = image.Encode(SKEncodedImageFormat.Png, 100);
        return data.ToArray();
    }
}
