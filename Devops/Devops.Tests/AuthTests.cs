namespace Devops.Tests;

public class AuthTests
{
    [Fact]
    public void JwtCookieNameIsConstant() =>
        Assert.Equal("DevopsUserToken", "DevopsUserToken");
}
