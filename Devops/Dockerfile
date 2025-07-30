### ---------- test stage ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS test
WORKDIR /src
COPY . .

ENV UseSqliteForTests=true \
    ConnectionStrings__DevopsDB="Data Source=file:memdb1?mode=memory&cache=shared" \
    JwtSettings__Secret=dummySecret \
    JwtSettings__Issuer=http://test \
    JwtSettings__Audience=http://test

RUN dotnet test Devops/Devops.sln --logger "trx;LogFileName=test-results.trx"

# --- build stage -------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish Devops/Devops.csproj -c Release -o /app/out

# --- runtime stage ----------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:5205
COPY --from=build /app/out .
EXPOSE 5205
ENTRYPOINT ["dotnet","Devops.dll"]

FROM scratch AS report
COPY --from=test /src/Devops.Tests/TestResults/test-results.trx /test-results.trx