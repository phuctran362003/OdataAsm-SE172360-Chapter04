using System.ComponentModel.DataAnnotations;

namespace OdataAsm_SE172360_Chapter04.API.Entities;

public class CovidRecord
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Country { get; set; }
    public string Province { get; set; }
    public DateTime Date { get; set; }
    public int Confirmed { get; set; }
}