FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend
WORKDIR /src/backend
# RUN apt-get update && apt-get install -y espeak-ng 
COPY ./VerseSketch.Backend/VerseSketch.Backend.csproj .
RUN dotnet restore "VerseSketch.Backend.csproj"
COPY . .
RUN dotnet publish "/src/backend/VerseSketch.Backend/VerseSketch.Backend.csproj" -c Debug -o /app

FROM mcr.microsoft.com/dotnet/runtime:9.0 AS final
WORKDIR /app
EXPOSE 80
COPY --from=backend ./app .
# COPY --from=backend /usr/bin/espeak-ng /usr/bin/espeak-ng
ENTRYPOINT ["dotnet", "VerseSketch.Backend.dll"]