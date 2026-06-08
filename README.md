# hybridge-x-widgets

Widgets interactivos para las clases de **Hybridge X 2.0**.  
Alojados como GitHub Pages y embebidos en la plataforma vía `iframe`.

## Estructura

```
hybridge-x-widgets/
├── index.html                  ← Página de inicio con todos los widgets
└── widgets/
    └── rgb-explorer/
        └── index.html          ← Widget: explorador RGB interactivo
```

## Cómo agregar un nuevo widget

1. Crea una carpeta dentro de `widgets/` con el nombre del widget (sin espacios, en kebab-case).  
   Ej: `widgets/dos-simulator/`
2. Agrega un `index.html` dentro de esa carpeta.
3. Registra el widget en el `index.html` raíz (la lista de widgets).

## Cómo embeber en la plataforma

La URL de cada widget sigue este patrón:

```
https://<tu-usuario>.github.io/hybridge-x-widgets/widgets/<nombre-widget>/
```

En la plataforma Hybridge Hub, usa el bloque de embed:

```
[hybridge://embed|url=https://<tu-usuario>.github.io/hybridge-x-widgets/widgets/rgb-explorer/]
```

## Widgets disponibles

| Widget | Clase | URL |
|---|---|---|
| RGB Explorer | Imágenes 3 | `/widgets/rgb-explorer/` |
