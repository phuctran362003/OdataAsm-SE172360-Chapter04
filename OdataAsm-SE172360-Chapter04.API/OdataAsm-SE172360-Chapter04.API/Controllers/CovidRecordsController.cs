using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using OdataAsm_SE172360_Chapter04.API.Entities;

namespace OdataAsm_SE172360_Chapter04.API.Controllers;

public class CovidRecordsController : ControllerBase
{
    private readonly IQueryable<CovidRecord> _data;

    public CovidRecordsController(IEnumerable<CovidRecord> data)
    {
        _data = data.AsQueryable();
    }
    
    [EnableQuery]
    public IQueryable<CovidRecord> Get()
    {
        return _data;
    }
}