### ---------- test stage ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS test
WORKDIR /src
COPY . .

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