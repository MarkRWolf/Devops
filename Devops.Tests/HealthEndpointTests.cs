using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;   

namespace Devops.Tests;

public class HealthEndpointTests :
    IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _c;

    public HealthEndpointTests(WebApplicationFactory<Program> f) =>
        _c = f.CreateClient();

    [Fact]
    public async Task Health_returns_200() =>
        Assert.Equal(HttpStatusCode.OK,
            (await _c.GetAsync("/health")).StatusCode);
}
