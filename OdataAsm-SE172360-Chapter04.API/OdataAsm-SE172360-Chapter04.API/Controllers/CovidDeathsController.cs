using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using OdataAsm_SE172360_Chapter04.API.Entities;

namespace OdataAsm_SE172360_Chapter04.API.Controllers;

public class CovidDeathsController : ControllerBase
{
    private readonly IQueryable<CovidRecord> _data;
    public CovidDeathsController(DeathsProvider provider)
    {
        _data = provider.Data.AsQueryable();
    }

    [EnableQuery]
    public IQueryable<CovidRecord> Get() => _data;
}