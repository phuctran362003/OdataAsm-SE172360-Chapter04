using System.ComponentModel.DataAnnotations;

namespace OdataAsm_SE172360_Chapter04.API.Entities;

public enum CovidValue
{
    Confirmed,
    Deaths,
    Recovered
}

public class CovidRecord
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Country { get; set; }
    public string Province { get; set; }
    public DateTime Date { get; set; }

    // theo yêu cầu: Value là enum (Confirmed/Deaths/Recovered)
    public CovidValue Value { get; set; }

    // số liệu thực tế (số ca)
    public int Count { get; set; }
}