using Microsoft.AspNetCore.OData;
using Microsoft.OData.ModelBuilder;
using OdataAsm_SE172360_Chapter04.API.Entities;
using CsvHelper;
using System.Globalization;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using SwaggerThemes;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://0.0.0.0:8080");

// OData + JSON config
builder.Services.AddControllers()
    .AddOData(opt =>
    {
        var edmBuilder = new ODataConventionModelBuilder();
        edmBuilder.EntitySet<CovidRecord>("CovidConfirmed");
        edmBuilder.EntitySet<CovidRecord>("CovidDeaths");
        edmBuilder.EntitySet<CovidRecord>("CovidRecovered");

        opt.AddRouteComponents("odata", edmBuilder.GetEdmModel())
            .Filter()
            .Select()
            .OrderBy()
            .Expand()
            .Count()
            .SetMaxTop(100000);
    })
    .AddJsonOptions(options =>
    {
        // serialize enum as string
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(p => p.AddPolicy("AllowAll", b => b.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

// Wrapper providers so DI can distinguish datasets
builder.Services.AddSingleton<ConfirmedProvider>();
builder.Services.AddSingleton<DeathsProvider>();
builder.Services.AddSingleton<RecoveredProvider>();

// Load datasets (async startup)
var confirmedUrl = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv";
var deathsUrl    = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv";
var recoveredUrl = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv";


// sau khi load dữ liệu
var confirmedData = await LoadCovidDataAsync(confirmedUrl, CovidValue.Confirmed);
var deathsData    = await LoadCovidDataAsync(deathsUrl, CovidValue.Deaths);
var recoveredData = await LoadCovidDataAsync(recoveredUrl, CovidValue.Recovered);
// đăng ký providers bằng instance có sẵn dữ liệu
builder.Services.AddSingleton(new ConfirmedProvider { Data = confirmedData });
builder.Services.AddSingleton(new DeathsProvider    { Data = deathsData });
builder.Services.AddSingleton(new RecoveredProvider { Data = recoveredData });
var app = builder.Build();

// Swagger UI in development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "API V1");
        c.RoutePrefix = string.Empty;
        c.InjectStylesheet("/swagger-ui/custom-theme.css");
        c.HeadContent = $"<style>{SwaggerTheme.GetSwaggerThemeCss(Theme.UniversalDark)}</style>";
    });
}

app.UseRouting();
app.UseStaticFiles();
app.UseSwagger();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();
app.Run();

static async Task<List<CovidRecord>> LoadCovidDataAsync(string url, CovidValue metric)
{
    using var http = new HttpClient();
    var csvData = await http.GetStringAsync(url);

    using var reader = new StringReader(csvData);
    using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);

    var table = csv.GetRecords<dynamic>().ToList();
    var list = new List<CovidRecord>();

    foreach (var row in table)
    {
        var dict = (IDictionary<string, object>)row;
        var country = dict.ContainsKey("Country/Region") ? dict["Country/Region"]?.ToString() : dict["Country"]?.ToString();
        var province = dict.ContainsKey("Province/State") ? dict["Province/State"]?.ToString() : dict["Province"]?.ToString();

        foreach (var key in dict.Keys.Where(k => DateTime.TryParse(k, out _)))
        {
            var countString = dict[key]?.ToString() ?? "0";
            if (!int.TryParse(countString, out var count)) count = 0;

            list.Add(new CovidRecord
            {
                Country = country,
                Province = province,
                Date = DateTime.Parse(key),
                Value = metric,
                Count = count
            });
        }
    }
    return list;
}

// simple provider wrappers for DI
public class ConfirmedProvider { public IEnumerable<CovidRecord> Data { get; set; } = Array.Empty<CovidRecord>(); }
public class DeathsProvider    { public IEnumerable<CovidRecord> Data { get; set; } = Array.Empty<CovidRecord>(); }
public class RecoveredProvider { public IEnumerable<CovidRecord> Data { get; set; } = Array.Empty<CovidRecord>(); }
