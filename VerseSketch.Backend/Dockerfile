FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend
WORKDIR /src/backend
COPY ./VerseSketch.Backend/VerseSketch.Backend.csproj .
RUN dotnet restore "VerseSketch.Backend.csproj"
COPY . .
RUN dotnet publish "/src/backend/VerseSketch.Backend/VerseSketch.Backend.csproj" -c Debug -o /app

FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS final
WORKDIR /app
EXPOSE 80
COPY --from=backend ./app .
ENTRYPOINT ["dotnet", "VerseSketch.Backend.dll"]