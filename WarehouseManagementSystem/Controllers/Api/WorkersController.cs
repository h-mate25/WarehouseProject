using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WarehouseManagementSystem.Data;
using WarehouseManagementSystem.Models;
using WarehouseManagementSystem.Services;

namespace WarehouseManagementSystem.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class WorkersController : ControllerBase
    {
        private readonly WarehouseContext _context;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ILogger<WorkersController> _logger;

        public WorkersController(
            WarehouseContext context,
            IPasswordHasher passwordHasher,
            ILogger<WorkersController> logger)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<WorkerDto>>> GetWorkers()
        {
            var workers = await _context.Workers.ToListAsync();
            return Ok(workers.Select(w => new WorkerDto
            {
                Id = w.Id,
                Username = w.Username,
                Email = w.Email,
                FullName = w.FullName,
                PhoneNumber = w.PhoneNumber,
                Role = w.Role,
                Department = w.Department,
                CreatedAt = w.CreatedAt,
                LastLogin = w.LastLogin,
                IsActive = w.IsActive
            }));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<WorkerDto>> GetWorker(int id)
        {
            var worker = await _context.Workers.FindAsync(id);

            if (worker == null)
            {
                return NotFound();
            }

            return new WorkerDto
            {
                Id = worker.Id,
                Username = worker.Username,
                Email = worker.Email,
                FullName = worker.FullName,
                PhoneNumber = worker.PhoneNumber,
                Role = worker.Role,
                Department = worker.Department,
                CreatedAt = worker.CreatedAt,
                LastLogin = worker.LastLogin,
                IsActive = worker.IsActive
            };
        }

        [HttpPost]
        public async Task<ActionResult<WorkerDto>> CreateWorker(CreateWorkerDto dto)
        {
            if (await _context.Workers.AnyAsync(w => w.Username == dto.Username))
            {
                return Conflict("Username already exists");
            }

            if (await _context.Workers.AnyAsync(w => w.Email == dto.Email))
            {
                return Conflict("Email already exists");
            }

            var worker = new Worker
            {
                Username = dto.Username,
                PasswordHash = _passwordHasher.HashPassword(dto.Password),
                Email = dto.Email,
                FullName = dto.FullName,
                PhoneNumber = dto.PhoneNumber,
                Role = dto.Role,
                Department = dto.Department,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Workers.Add(worker);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {AdminUsername} created worker with username: {Username}", 
                User.Identity.Name, worker.Username);

            return CreatedAtAction(nameof(GetWorker), new { id = worker.Id }, new WorkerDto
            {
                Id = worker.Id,
                Username = worker.Username,
                Email = worker.Email,
                FullName = worker.FullName,
                PhoneNumber = worker.PhoneNumber,
                Role = worker.Role,
                Department = worker.Department,
                CreatedAt = worker.CreatedAt,
                LastLogin = worker.LastLogin,
                IsActive = worker.IsActive
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWorker(int id, UpdateWorkerDto dto)
        {
            var worker = await _context.Workers.FindAsync(id);

            if (worker == null)
            {
                return NotFound();
            }

            // Check if email is being changed and if it's already in use
            if (dto.Email != worker.Email && await _context.Workers.AnyAsync(w => w.Email == dto.Email))
            {
                return Conflict("Email already exists");
            }

            worker.Email = dto.Email;
            worker.FullName = dto.FullName;
            worker.PhoneNumber = dto.PhoneNumber;
            worker.Role = dto.Role;
            worker.Department = dto.Department;
            worker.IsActive = dto.IsActive;

            if (!string.IsNullOrEmpty(dto.Password))
            {
                worker.PasswordHash = _passwordHasher.HashPassword(dto.Password);
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!WorkerExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            _logger.LogInformation("User {AdminUsername} updated worker with username: {Username}", 
                User.Identity.Name, worker.Username);

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWorker(int id)
        {
            var worker = await _context.Workers.FindAsync(id);
            if (worker == null)
            {
                return NotFound();
            }

            // Don't allow deleting the last admin
            if (worker.Role == "Admin" && await _context.Workers.CountAsync(w => w.Role == "Admin") <= 1)
            {
                return BadRequest("Cannot delete the last admin user");
            }

            _context.Workers.Remove(worker);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {AdminUsername} deleted worker with username: {Username}", 
                User.Identity.Name, worker.Username);

            return NoContent();
        }

        private bool WorkerExists(int id)
        {
            return _context.Workers.Any(e => e.Id == id);
        }
    }

    // DTOs to avoid exposing password hash
    public class WorkerDto
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string Role { get; set; }
        public string? Department { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLogin { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateWorkerDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string Role { get; set; }
        public string? Department { get; set; }
    }

    public class UpdateWorkerDto
    {
        public string Email { get; set; }
        public string FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string Role { get; set; }
        public string? Department { get; set; }
        public bool IsActive { get; set; }
        public string? Password { get; set; } // Optional, only update if provided
    }
} 