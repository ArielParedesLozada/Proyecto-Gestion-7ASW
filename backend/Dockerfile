# Etapa 1: build

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar todo (más seguro para soluciones con múltiples proyectos)

COPY . .

# Restaurar dependencias

RUN dotnet restore

# Publicar aplicación

RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Etapa 2: runtime

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copiar artefactos publicados

COPY --from=build /app/publish .

# Exponer puerto

EXPOSE 4780

# Variables de entorno

ENV ASPNETCORE_URLS=http://+:4780
ENV ASPNETCORE_ENVIRONMENT=Production


ENTRYPOINT ["dotnet", "backend.dll"]
