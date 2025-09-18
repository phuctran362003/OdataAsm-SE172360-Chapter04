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

// JSON + OData config
builder.Services.AddControllers()
    .AddOData(opt =>
    {
        var edmBuilder = new ODataConventionModelBuilder();
        edmBuilder.EntitySet<CovidRecord>("CovidRecords");
        opt.AddRouteComponents("odata", edmBuilder.GetEdmModel())
            .Filter()
            .Select()
            .OrderBy()
            .Expand()
            .Count()
            .SetMaxTop(100000); // cho phép dùng $top tối đa 1000
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
        });
});

// Load CSV từ GitHub Raw
var rawUrl = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv";
var covidData = await LoadCovidDataAsync(rawUrl);
builder.Services.AddSingleton<IEnumerable<CovidRecord>>(covidData);

var app = builder.Build();

// Swagger
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

// Helper
static async Task<List<CovidRecord>> LoadCovidDataAsync(string url)
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
        var country = dict["Country/Region"]?.ToString();
        var province = dict["Province/State"]?.ToString();

        foreach (var key in dict.Keys.Where(k => DateTime.TryParse(k, out _)))
        {
            list.Add(new CovidRecord
            {
                Country = country,
                Province = province,
                Date = DateTime.Parse(key),
                Confirmed = int.Parse(dict[key]?.ToString() ?? "0")
            });
        }
    }
    return list;
}
