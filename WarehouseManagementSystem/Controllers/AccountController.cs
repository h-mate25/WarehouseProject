using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Diagnostics;
using WarehouseManagementSystem.Data;
using WarehouseManagementSystem.Models;
using WarehouseManagementSystem.Services;

namespace WarehouseManagementSystem.Controllers
{
    public class AccountController : Controller
    {
        private readonly WarehouseContext _context;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ILogger<AccountController> _logger;

        public AccountController(
            WarehouseContext context,
            IPasswordHasher passwordHasher,
            ILogger<AccountController>? logger = null)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _logger = logger ?? NullLoggerFactory.Instance.CreateLogger<AccountController>();
        }

        [HttpGet]
        [AllowAnonymous]
        public IActionResult Login(string returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;
            return View();
        }

        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel model)
        {
            ViewData["ReturnUrl"] = model.ReturnUrl;
            
            // Add debugging information to response
            ViewData["DebugInfo"] = "Starting login process";
            
            if (ModelState.IsValid)
            {
                // Debug: Check if there are any workers in the database
                var workersCount = await _context.Workers.CountAsync();
                ViewData["DebugInfo"] += $"<br>Found {workersCount} workers in database.";
                
                var worker = await _context.Workers
                    .FirstOrDefaultAsync(w => w.Username == model.Username && w.IsActive);
                
                if (worker == null)
                {
                    ViewData["DebugInfo"] += $"<br>No worker found with username: {model.Username}";
                    ModelState.AddModelError(string.Empty, "Invalid login attempt.");
                    return View(model);
                }
                
                ViewData["DebugInfo"] += $"<br>Found worker: {worker.Username}, Hash: {worker.PasswordHash?.Substring(0, 20)}...";
                
                bool passwordValid = _passwordHasher.VerifyPassword(worker.PasswordHash, model.Password);
                ViewData["DebugInfo"] += $"<br>Password verification result: {passwordValid}";
                
                if (passwordValid)
                {
                    _logger.LogInformation("User {username} logged in", model.Username);
                    
                    // Update last login timestamp
                    worker.LastLogin = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    
                    var claims = new List<Claim>
                    {
                        new Claim(ClaimTypes.Name, worker.Username),
                        new Claim(ClaimTypes.Email, worker.Email),
                        new Claim(ClaimTypes.GivenName, worker.FullName),
                        new Claim(ClaimTypes.Role, worker.Role),
                        new Claim("UserId", worker.Id.ToString())
                    };
                    
                    if (!string.IsNullOrEmpty(worker.Department))
                    {
                        claims.Add(new Claim("Department", worker.Department));
                    }
                    
                    var claimsIdentity = new ClaimsIdentity(
                        claims, CookieAuthenticationDefaults.AuthenticationScheme);
                    
                    var authProperties = new AuthenticationProperties
                    {
                        IsPersistent = model.RememberMe,
                        ExpiresUtc = DateTimeOffset.UtcNow.AddDays(model.RememberMe ? 30 : 1)
                    };
                    
                    await HttpContext.SignInAsync(
                        CookieAuthenticationDefaults.AuthenticationScheme,
                        new ClaimsPrincipal(claimsIdentity),
                        authProperties);
                    
                    return RedirectToLocal(model.ReturnUrl);
                }
                
                ModelState.AddModelError(string.Empty, "Invalid login attempt.");
                return View(model);
            }
            
            // If we got this far, something failed, redisplay form
            return View(model);
        }
        
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            _logger.LogInformation("User logged out");
            return RedirectToAction(nameof(HomeController.Index), "Home");
        }
        
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> Profile()
        {
            var username = User.Identity.Name;
            var worker = await _context.Workers.FirstOrDefaultAsync(w => w.Username == username);
            
            if (worker == null)
            {
                return NotFound();
            }
            
            return View(worker);
        }
        
        private IActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
            
            return RedirectToAction(nameof(HomeController.Index), "Home");
        }
    }

    internal class NullLoggerFactory : ILoggerFactory
    {
        public static readonly NullLoggerFactory Instance = new();

        public void AddProvider(ILoggerProvider provider) { }
        public ILogger CreateLogger(string categoryName) => NullLogger.Instance;
        public void Dispose() { }

        private class NullLogger : ILogger
        {
            public static readonly ILogger Instance = new NullLogger();

            public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
            public bool IsEnabled(LogLevel logLevel) => false;
            public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) { }
        }
    }
} 