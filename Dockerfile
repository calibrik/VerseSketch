FROM node:20-alpine AS frontend
WORKDIR /src/frontend
COPY ./verseSketch-frontend/package*.json ./
RUN npm install
COPY ./verseSketch-frontend ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend
WORKDIR /src/backend
COPY ./VerseSketch.Backend/VerseSketch.Backend/VerseSketch.Backend.csproj .
RUN dotnet restore "VerseSketch.Backend.csproj"
COPY ./VerseSketch.Backend .
COPY --from=frontend ./src/frontend/dist ./VerseSketch.Backend/wwwroot
RUN dotnet publish "/src/backend/VerseSketch.Backend/VerseSketch.Backend.csproj" -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS final
WORKDIR /app
EXPOSE 80
RUN apk update && apk add espeak-ng 
COPY --from=backend ./app .
ENTRYPOINT ["dotnet", "VerseSketch.Backend.dll"]