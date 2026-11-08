
# Sistema de Gestión de Recursos Humanos

### Grupo Calma | Proyecto de Cátedra DWS901

Aplicación web desarrollada para la gestión de empleados, usuarios y solicitudes de Recursos Humanos de Grupo Calma, como parte de la asignatura **Desarrollo de Aplicaciones Web con Software Interpretado en el Servidor (DWS901)** de la Universidad Don Bosco.

El sistema centraliza los procesos de solicitud y aprobación de vacaciones y permisos, incorpora controles de acceso basados en roles y permite consultar información administrativa mediante reportes.

## Tecnologías

| Componente | Tecnología |
| --- | --- |
| Frontend | HTML5, CSS3 y JavaScript |
| Backend | Node.js y Express |
| Base de datos | MySQL |
| Acceso a datos | mysql2 |
| Autenticación | JSON Web Tokens (JWT) y bcryptjs |
| Gestión de archivos | Multer y file-type |
| Reportes | Chart.js, SheetJS y jsPDF |
| Configuración | dotenv |
| Control de versiones | Git y GitHub |

La aplicación utiliza una arquitectura cliente-servidor con una API REST, organizada mediante rutas, controladores, modelos y servicios.

## Funcionalidades

### Autenticación y control de acceso

- Inicio y cierre de sesión.
- Autenticación mediante JWT.
- Protección de rutas y operaciones según los permisos del usuario.
- Contraseñas almacenadas mediante hash.

### Gestión de usuarios

- Registro y consulta de cuentas.
- Modificación de información y roles.
- Desactivación de usuarios.
- Administración restringida al Administrador de TI.

### Gestión de empleados

- Registro, consulta y actualización de empleados.
- Asociación de cuentas de usuario y jefes inmediatos.
- Búsqueda por nombre y filtros por cargo y estado.
- Visualización de información detallada.
- Consulta de saldos de vacaciones por año.
- Desactivación y reactivación de empleados.
- Restricciones de operaciones según el rol.

### Solicitudes de Recursos Humanos

- Registro de solicitudes de vacaciones y permisos.
- Consulta de solicitudes propias e historial.
- Seguimiento del estado y etapas de aprobación.
- Incorporación y validación de documentos adjuntos.
- Validación de disponibilidad de vacaciones.

### Aprobaciones

- Consulta de solicitudes pendientes según el rol.
- Resolución de etapas de aprobación.
- Validación de responsables y jerarquía organizacional.
- Actualización del estado de las solicitudes.

### Reportes

- Resumen de solicitudes por estado y período.
- Visualización de estadísticas y gráficos.
- Consulta de saldos de vacaciones.
- Filtros por fechas y tipo de solicitud.
- Exportación a Excel y PDF.

## Roles y permisos

El sistema contempla seis roles con distintos niveles de acceso.

| Rol | Permisos principales |
| --- | --- |
| Empleado | Registrar y consultar sus solicitudes. |
| Jefe inmediato | Revisar y resolver las solicitudes asignadas a su nivel de aprobación. |
| Analista de Nómina | Consultar empleados, gestionar las aprobaciones correspondientes y acceder a reportes. |
| Gerente | Consultar empleados, gestionar aprobaciones y acceder a reportes. |
| Asistente de planilla | Consultar, registrar y editar empleados; acceder a las funciones autorizadas de solicitudes y reportes. |
| Administrador de TI | Gestionar cuentas y empleados, incluyendo desactivación y reactivación de empleados. |

La autorización se verifica desde el servidor mediante middleware. Las restricciones de la interfaz complementan estos controles.

## Instalación y ejecución

### Requisitos previos

- Node.js y npm.
- MySQL.
- MySQL Workbench u otro cliente compatible.
- Git.
- Navegador web actualizado.

### 1. Clonar el repositorio

```bash
git clone https://github.com/dleiva404/DWS-Proyecto-Catedra.git
cd DWS-Proyecto-Catedra
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar la base de datos

Iniciar MySQL y ejecutar el archivo `database.sql` desde MySQL Workbench o un cliente compatible.

El script crea la base de datos `sistema_rrhh`, su estructura relacional y los registros iniciales utilizados para pruebas.

**Importante:** `database.sql` contiene la instrucción `DROP DATABASE IF EXISTS sistema_rrhh`. Su ejecución elimina la base de datos existente antes de recrearla. No debe utilizarse sobre información que se necesite conservar sin realizar previamente un respaldo.

### 4. Configurar las variables de entorno

Crear un archivo `.env` en la raíz del proyecto, tomando como referencia `.env.example`.

```dotenv
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=sistema_rrhh
PORT=3000
JWT_SECRET=definir_una_clave_segura_y_privada
```

Ajustar los valores según el entorno local.

El archivo `.env` contiene información sensible y no debe incorporarse al repositorio.

### 5. Iniciar la aplicación

Ejecución normal:

```bash
npm start
```

Ejecución en modo de desarrollo, con reinicio automático:

```bash
npm run dev
```

Una vez iniciado el servidor, acceder desde el navegador:

**http://localhost:3000**

La aplicación redirige a la pantalla de inicio de sesión. Para las pruebas se utilizan las cuentas definidas en la base de datos inicial, cuyas credenciales deben obtenerse del equipo responsable.

## Estructura del proyecto

```text
DWS-Proyecto-Catedra/
├── app.js
├── config/
│   ├── db.js
│   └── uploadConfig.js
├── controllers/
├── middlewares/
├── models/
├── routes/
├── services/
├── scripts/
├── public/
│   ├── login/
│   ├── dashboard/
│   ├── usuarios/
│   ├── empleados/
│   ├── solicitudes/
│   ├── aprobaciones/
│   ├── reportes/
│   ├── comun/
│   └── assets/
├── uploads/
│   └── solicitudes/
├── database.sql
├── .env.example
├── package.json
└── package-lock.json
```

La organización del proyecto responde a las siguientes responsabilidades:

- **`config/`:** conexión a la base de datos y configuración de archivos.
- **`controllers/`:** procesamiento de las peticiones y respuestas HTTP.
- **`middlewares/`:** autenticación y autorización.
- **`models/`:** consultas y operaciones sobre MySQL.
- **`routes/`:** definición de los endpoints de la API.
- **`services/`:** implementación de la lógica de negocio.
- **`public/`:** interfaz web, recursos visuales y scripts del cliente.
- **`uploads/`:** almacenamiento de documentos adjuntos.

## API REST

El servidor Express expone los siguientes grupos de rutas:

| Endpoint | Responsabilidad |
| --- | --- |
| `/api/auth` | Autenticación y gestión de sesiones. |
| `/api/usuarios` | Administración de cuentas. |
| `/api/empleados` | Gestión de empleados y consulta de saldos. |
| `/api/solicitudes` | Registro, consulta y aprobación de solicitudes. |
| `/api/reportes` | Obtención de información para reportes. |
| `/api/roles` | Consulta de roles del sistema. |
| `/api/tipos-solicitud` | Consulta de tipos de solicitud. |

Las operaciones protegidas requieren autenticación mediante JWT y autorización según los roles definidos.

## Validaciones y pruebas

Se han realizado pruebas funcionales manuales sobre el módulo de Gestión de empleados, incluyendo:

- Consulta, registro y actualización de información.
- Búsqueda y aplicación de filtros.
- Visualización de detalles y saldos de vacaciones.
- Desactivación y reactivación.
- Verificación de la visibilidad de acciones según el rol.
- Pruebas de autorización en la API, comprobando respuestas HTTP 403 ante operaciones no permitidas.

El proyecto no dispone actualmente de una suite de pruebas automatizadas configurada.

## Consideraciones técnicas

### Gestión de vacaciones

La base de datos incluye saldos iniciales de vacaciones para empleados de prueba.

El sistema permite consultar los días asignados, utilizados y disponibles, así como validar y descontar días dentro del flujo de solicitudes.

La asignación automática de un saldo inicial al registrar empleados nuevos y la generación de saldos para períodos posteriores permanecen pendientes de integración.

### Funcionalidades previstas

Las opciones de constancia salarial y soporte técnico se presentan en la interfaz como funcionalidades futuras.

### Alcance

El sistema fue desarrollado con fines académicos y de demostración. Su utilización en un entorno de producción requeriría evaluaciones adicionales de seguridad, pruebas automatizadas y ajustes operativos.

## Información académica

**Institución:** Universidad Don Bosco  
**Asignatura:** Desarrollo de Aplicaciones Web con Software Interpretado en el Servidor (DWS901)  
**Proyecto:** Sistema de Gestión de Recursos Humanos  
**Empresa de referencia:** Grupo Calma  
**Año:** 2026

---

Proyecto de cátedra desarrollado en equipo por estudiantes de la Universidad Don Bosco.
