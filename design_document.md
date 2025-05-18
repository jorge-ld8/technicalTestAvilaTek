# Diseño Arquitectónico de API REST de Comercio Electrónico

## Decisiones de Diseño y Arquitectura

Este documento presenta las decisiones de diseño tomadas durante el desarrollo de la prueba técnica explicando los motivos detrás de cada elección, las tecnologías implementadas y los patrones arquitectónicos utilizados.

### Arquitectura General

Se adoptó una arquitectura de capas bien definida para garantizar la separación de responsabilidades, siguiendo el patrón:

**Rutas → Controladores → Servicios → Repositorios → Base de Datos**

Esta estructura va de acuerdo al principo SOLID Single Responsibility Principle:
- **Modularidad**: Cada componente tiene una responsabilidad única y clara
- **Mantenibilidad**: Facilita la localización y corrección de errores
- **Escalabilidad**: Permite escalar componentes específicos según sea necesario. Por ejemplo si se desea crear un nuevo Router, solo se debe extender de la clase BaseRouter y especificar el Controlador a usar. Esto garantiza un tipado fuerte y la extensibilidad del proyecto.

### Tecnologías Principales

#### Base de Datos: Prisma con PostgreSQL

Se eligió Prisma ORM con PostgreSQL por:
- **Tipado fuerte**: Buena integración con TypeScript que para la lógica de negocio del comercio electrónico es necesaria ya que la estructura es netamente relacional.
- **Migraciones automatizadas**: Simplifica la evolución del esquema de la base de datos
- **Transacciones atómicas**: Garantiza la integridad de los datos en operaciones complejas
- **Escalabilidad**: PostgreSQL ofrece rendimiento robusto y escalable.

#### Procesamiento Asíncrono: RabbitMQ

Se implementó colas de RabbitMQ para:
- **Procesamiento asincrónico**: Las operaciones intensivas como actualización de inventario se ejecutan en segundo plano
- **Desacoplamiento de servicios**: Reduce la dependencia entre componentes
- **Extensible**: Actualmente solo se implementó para la actualización de inventario pero se puede realizar la integración con RabbitMQ para otros casos.


#### Seguridad

Se implementaron capas de seguridad:
- **JWT para autenticación**: Tokens para gestionar sesiones de usuario
- **CORS configurado**: Control de acceso para prevenir ataques cross-origin
- **Autorización**: Se implementó Autorización basada en roles, en donde de acuerdo al rol del usuario puede o no acceder al endpoint (Por defecto todos los usuarios son Clientes).
- **Rate limiting**: Previene ataques de fuerza bruta y abuso de la API
- **Compresión**: Mejora el rendimiento y reduce la exposición de datos

### Patrones y Prácticas

#### Patrón Repositorio

Se implementó el patrón repositorio para abstraer la capa de acceso a datos:
- Facilita el cambio de tecnología de base de datos sin afectar la lógica de negocio
- Encapsula las consultas complejas y operaciones a la base de datos
- Cada entidad (Usuario, Producto, Orden) tiene su propio repositorio.
- Abstrae consultas.

#### DTOs (Data Transfer Objects)

Se utilizaron DTOs para:
- Definir claramente los datos que entran y salen de la API
- Aplicar validación de datos en la capa correcta
- Separar la representación externa de los modelos internos
- Facilitar cambios en los modelos sin romper contratos de API

#### Paginación Genérica

Implementamos un sistema de paginación uniforme que:
- Permite ajustar el tamaño de página y navegar entre resultados
- Incluye metadatos (total de elementos, páginas, etc.)

#### Gestión de Errores Centralizada

Se creo un sistema de manejo de errores que:
- Proporciona respuestas de error consistentes.
- Clasifica los errores en categorías comprensibles (BadRequest, NotFound, etc.)
- Evita la repetición de código para manejo de errores en controladores
- Interfaz estándar de respuestas de error en ErrorResponse.

#### Gestión de Inventario

- Validación de disponibilidad antes de crear órdenes
- Actualización asincrónica del inventario después de confirmación de orden
- Restauración automática del inventario cuando se cancelan órdenes

#### Procesamiento de Órdenes

- Manejo de estados de orden (PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED)
- Cálculo automático del monto total basado en precios actuales
- Registro del precio al momento de la compra para preservar la integridad histórica

### Escalabilidad y Rendimiento

- **Endpoints optimizados**: Separación de endpoints con alta carga de tráfico
- **Paralelización con Promise.all**: Uso de Promise.all para ejecutar operaciones asíncronas en paralelo en lugar de awaits secuenciales, mejorando significativamente el rendimiento cuando se necesitan múltiples recursos independientes.
- **Base de datos hosteada en Prisma Postgres integrado con Accelerate**: este contiene un cache global con pooling built-in. Diseñado para la facilidad de uso y escalabilidad.
- **Procesamiento asincrónico**: Operaciones intensivas desplazadas fuera del event loop.
- **Transacciones eficientes**: Uso de transacciones de base de datos para operaciones complejas.
