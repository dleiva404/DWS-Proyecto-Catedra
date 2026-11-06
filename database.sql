-- =====================================================
-- BASE DE DATOS
-- Sistema de Gestión de Solicitudes de Recursos Humanos
-- Grupo Calma
-- =====================================================
SET NAMES utf8mb4;
DROP DATABASE IF EXISTS sistema_rrhh;
CREATE DATABASE sistema_rrhh;

USE sistema_rrhh;

-- =====================================================
-- 1. TABLA: ROL
-- =====================================================

CREATE TABLE rol (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);


-- =====================================================
-- 2. TABLA: USUARIO
-- =====================================================

CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_rol INT NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    estado BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol)
        REFERENCES rol(id_rol)
);


-- =====================================================
-- 3. TABLA: EMPLEADO
-- =====================================================

CREATE TABLE empleado (
    id_empleado INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    id_supervisor INT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    cargo VARCHAR(100) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    estado BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_empleado_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario),

    CONSTRAINT fk_empleado_supervisor
        FOREIGN KEY (id_supervisor)
        REFERENCES empleado(id_empleado)
);


-- =====================================================
-- 4. TABLA: TIPO_SOLICITUD
-- =====================================================

CREATE TABLE tipo_solicitud (
    id_tipo_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);


-- =====================================================
-- 5. TABLA: SOLICITUD
-- =====================================================

CREATE TABLE solicitud (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    id_empleado INT NOT NULL,
    id_tipo_solicitud INT NOT NULL,
    fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio DATE NULL,
    fecha_fin DATE NULL,
    motivo VARCHAR(500) NULL,
    estado VARCHAR(30) NOT NULL,
    archivo_adjunto VARCHAR(255) NULL,


    CONSTRAINT fk_solicitud_empleado
        FOREIGN KEY (id_empleado)
        REFERENCES empleado(id_empleado),

    CONSTRAINT fk_solicitud_tipo
        FOREIGN KEY (id_tipo_solicitud)
        REFERENCES tipo_solicitud(id_tipo_solicitud),

    CONSTRAINT chk_solicitud_fechas
        CHECK (
            fecha_fin IS NULL
            OR fecha_inicio IS NULL
            OR fecha_fin >= fecha_inicio
        )
);


-- =====================================================
-- 6. TABLA: ETAPA_SOLICITUD
-- =====================================================

CREATE TABLE etapa_solicitud (
    id_etapa_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT NOT NULL,
    id_rol INT NOT NULL,
    nombre_etapa VARCHAR(100) NOT NULL,
    orden INT NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
    fecha_inicio DATETIME NULL,
    fecha_resolucion DATETIME NULL,
    decision VARCHAR(30) NULL,
    comentario VARCHAR(500) NULL,
    id_usuario_responsable INT NULL,

    CONSTRAINT fk_etapa_responsable
        FOREIGN KEY (id_usuario_responsable)
        REFERENCES usuario(id_usuario),

    CONSTRAINT fk_etapa_solicitud
        FOREIGN KEY (id_solicitud)
        REFERENCES solicitud(id_solicitud),

    CONSTRAINT fk_etapa_rol
        FOREIGN KEY (id_rol)
        REFERENCES rol(id_rol),

    CONSTRAINT chk_etapa_orden
        CHECK (orden > 0)
);


-- =====================================================
-- 7. TABLA: SALDO_VACACIONES
-- =====================================================

CREATE TABLE saldo_vacaciones (
    id_saldo INT AUTO_INCREMENT PRIMARY KEY,
    id_empleado INT NOT NULL,
    anio YEAR NOT NULL,
    dias_asignados INT NOT NULL DEFAULT 15,
    dias_utilizados INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_saldo_empleado
        FOREIGN KEY (id_empleado)
        REFERENCES empleado(id_empleado),

    CONSTRAINT uq_saldo_empleado_anio
        UNIQUE (id_empleado, anio),

    CONSTRAINT chk_dias_asignados
        CHECK (dias_asignados >= 0),

    CONSTRAINT chk_dias_utilizados
        CHECK (
            dias_utilizados >= 0
            AND dias_utilizados <= dias_asignados
        )
);


-- =====================================================
-- 8. TABLA: CONSTANCIA
-- =====================================================

CREATE TABLE constancia (
    id_constancia INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT NOT NULL,
    tipo_constancia VARCHAR(50) NOT NULL,

    CONSTRAINT fk_constancia_solicitud
        FOREIGN KEY (id_solicitud)
        REFERENCES solicitud(id_solicitud),

    CONSTRAINT uq_constancia_solicitud
        UNIQUE (id_solicitud)
);


-- =====================================================
-- DATOS INICIALES: ROLES
-- =====================================================

INSERT INTO rol (nombre) VALUES
('Empleado'),
('Jefe inmediato'),
('Analista de Nómina'),
('Gerente'),
('Asistente de planilla'),
('Administrador de TI');


-- =====================================================
-- DATOS INICIALES: TIPOS DE SOLICITUD
-- =====================================================

INSERT INTO tipo_solicitud (nombre) VALUES
('Vacaciones'),
('Permiso'),
('Constancia');

-- =====================================================
-- DATOS DE PRUEBA: USUARIOS
-- =====================================================

INSERT INTO usuario (id_rol, usuario, contrasena_hash, estado) VALUES
(1, 'nsolano', '$2b$10$2ou26x3JXCLjgmS3WtK3p./H6P343IfK.rvfaOh6232Wm9jqQRkrW', TRUE),
(2, 'ccornejo', '$2b$10$2ou26x3JXCLjgmS3WtK3p./H6P343IfK.rvfaOh6232Wm9jqQRkrW', TRUE),
(3, 'scea', '$2b$10$2ou26x3JXCLjgmS3WtK3p./H6P343IfK.rvfaOh6232Wm9jqQRkrW', TRUE),
(4, 'dleiva', '$2b$10$2ou26x3JXCLjgmS3WtK3p./H6P343IfK.rvfaOh6232Wm9jqQRkrW', TRUE),
(5, 'lperez', '$2b$10$2ou26x3JXCLjgmS3WtK3p./H6P343IfK.rvfaOh6232Wm9jqQRkrW', TRUE),
(6, 'jaguilar', '$2b$10$2ou26x3JXCLjgmS3WtK3p./H6P343IfK.rvfaOh6232Wm9jqQRkrW', TRUE),
(1, 'mhernandez', '$2b$10$2ou26x3JXCLjgmS3WtK3p./H6P343IfK.rvfaOh6232Wm9jqQRkrW', TRUE),
(1, 'jramirez', '$2b$10$2ou26x3JXCLjgmS3WtK3p./H6P343IfK.rvfaOh6232Wm9jqQRkrW', TRUE),
(1, 'kflores', '$2b$10$2ou26x3JXCLjgmS3WtK3p./H6P343IfK.rvfaOh6232Wm9jqQRkrW', TRUE);


-- =====================================================
-- DATOS DE PRUEBA: EMPLEADOS
-- =====================================================

INSERT INTO empleado
(id_usuario, id_supervisor, nombre, apellido, correo, cargo, fecha_ingreso, estado)
VALUES
(2, NULL, 'Carlos Alberto', 'Cornejo Calderón', 'carlos.cornejo@grupocalma.com', 'Jefe de Área', '2022-03-10', TRUE),
(1, 1, 'Nelson Mauricio', 'Solano Guardado', 'nelson.solano@grupocalma.com', 'Auxiliar administrativo', '2024-01-15', TRUE),
(3, 1, 'Sara Michelle', 'Cea Rias', 'sara.cea@grupocalma.com', 'Analista de Nómina', '2023-05-02', TRUE),
(4, NULL, 'David Antonio', 'Leiva Martínez', 'david.leiva@grupocalma.com', 'Gerente de RRHH', '2021-08-16', TRUE),
(5, 1, 'Lily Astrid', 'Pérez Avelar', 'lily.perez@grupocalma.com', 'Asistente de planilla', '2024-06-03', TRUE),
(6, 1, 'Jehudi Neftalí', 'Aguilar Araujo', 'jehudi.aguilar@grupocalma.com', 'Administrador de TI', '2023-11-20', TRUE),
(7, 1, 'María José', 'Hernández Ramos', 'maria.hernandez@grupocalma.com', 'Vendedora', '2024-02-12', TRUE),
(8, 1, 'José Roberto', 'Ramírez Mejía', 'jose.ramirez@grupocalma.com', 'Bodeguero', '2023-09-04', TRUE),
(9, 1, 'Karla Beatriz', 'Flores Castillo', 'karla.flores@grupocalma.com', 'Cajera', '2025-03-17', TRUE);

-- =====================================================
-- DATOS DE PRUEBA: SALDOS DE VACACIONES
-- =====================================================

INSERT INTO saldo_vacaciones
(id_empleado, anio, dias_asignados, dias_utilizados)
VALUES
(1, 2026, 15, 5),
(2, 2026, 15, 3),
(3, 2026, 15, 5),
(4, 2026, 15, 3),
(5, 2026, 15, 5),
(6, 2026, 15, 5),
(7, 2026, 15, 10),
(8, 2026, 15, 6),
(9, 2026, 15, 5),
(1, 2027, 15, 0),
(2, 2027, 15, 0),
(3, 2027, 15, 0),
(4, 2027, 15, 0),
(5, 2027, 15, 0),
(6, 2027, 15, 0),
(7, 2027, 15, 0),
(8, 2027, 15, 0),
(9, 2027, 15, 0);

-- =====================================================
-- DATOS DE PRUEBA: SOLICITUDES DE EJEMPLO
-- =====================================================

INSERT INTO solicitud
(id_empleado, id_tipo_solicitud, fecha_solicitud, fecha_inicio, fecha_fin, motivo, estado)
VALUES
(2, 1, '2026-09-01 09:00:00', '2026-09-14', '2026-09-16', NULL, 'Aprobada'),
(1, 2, '2026-09-20 10:00:00', '2026-09-25', '2026-09-25', 'Cita en el banco', 'Rechazada'),
(2, 2, '2026-10-05 08:30:00', '2026-10-09', '2026-10-09', 'Cita medica', 'Aprobada'),
(4, 1, '2026-10-12 14:00:00', '2026-10-26', '2026-10-28', NULL, 'Aprobada'),
(3, 2, '2026-10-15 11:00:00', '2026-10-20', '2026-10-20', 'Tramite personal', 'Rechazada'),
(7, 1, '2026-01-08 08:15:00', '2026-01-19', '2026-01-23', NULL, 'Aprobada'),
(8, 2, '2026-01-20 13:40:00', '2026-01-22', '2026-01-22', 'Consulta medica', 'Aprobada'),
(9, 3, '2026-02-03 10:05:00', NULL, NULL, 'Constancia de trabajo para el banco', 'Aprobada'),
(5, 1, '2026-02-10 09:30:00', '2026-02-23', '2026-02-27', NULL, 'Aprobada'),
(6, 2, '2026-02-18 15:20:00', '2026-02-20', '2026-02-20', 'Tramite en el DUI', 'Rechazada'),
(8, 1, '2026-03-02 08:50:00', '2026-03-30', '2026-04-04', NULL, 'Aprobada'),
(2, 3, '2026-03-11 11:10:00', NULL, NULL, 'Constancia de salario', 'Aprobada'),
(7, 2, '2026-03-25 14:00:00', '2026-03-27', '2026-03-27', 'Graduacion de mi hijo', 'Aprobada'),
(1, 1, '2026-04-06 09:00:00', '2026-04-20', '2026-04-24', NULL, 'Aprobada'),
(9, 2, '2026-04-15 16:30:00', '2026-04-17', '2026-04-17', 'Cita en el seguro social', 'Aprobada'),
(6, 1, '2026-05-04 10:45:00', '2026-05-18', '2026-05-22', NULL, 'Rechazada'),
(3, 1, '2026-05-12 08:20:00', '2026-05-25', '2026-05-29', NULL, 'Aprobada'),
(5, 2, '2026-06-01 09:10:00', '2026-06-03', '2026-06-03', 'Tramite bancario', 'Aprobada'),
(8, 3, '2026-06-09 13:00:00', NULL, NULL, 'Constancia para la universidad', 'Aprobada'),
(7, 1, '2026-06-22 11:30:00', '2026-07-06', '2026-07-10', NULL, 'Aprobada'),
(2, 2, '2026-07-08 08:00:00', '2026-07-10', '2026-07-10', 'Mudanza', 'Rechazada'),
(9, 1, '2026-07-20 15:15:00', '2026-08-03', '2026-08-07', NULL, 'Aprobada'),
(6, 3, '2026-08-05 10:00:00', NULL, NULL, 'Constancia para tramite de vivienda', 'Aprobada'),
(5, 1, '2026-08-17 09:40:00', '2026-08-31', '2026-09-04', NULL, 'Rechazada'),
(1, 3, '2026-09-03 14:25:00', NULL, NULL, 'Constancia de trabajo', 'Aprobada'),
(9, 2, '2026-09-15 08:35:00', '2026-09-18', '2026-09-18', 'Cita medica', 'Aprobada'),
(8, 2, '2026-10-02 10:20:00', '2026-10-05', '2026-10-05', 'Tramite personal', 'Aprobada'),
(6, 1, '2026-10-14 09:05:00', '2026-10-26', '2026-10-30', NULL, 'Aprobada'),
(7, 3, '2026-10-21 16:00:00', NULL, NULL, 'Constancia de salario', 'Rechazada'),
(2, 1, '2026-11-02 08:30:00', '2026-12-21', '2026-12-24', NULL, 'Pendiente'),
(9, 1, '2026-11-03 10:00:00', '2026-12-14', '2026-12-18', NULL, 'Pendiente'),
(5, 2, '2026-11-04 09:15:00', '2026-11-13', '2026-11-13', 'Cita medica', 'Pendiente'),
(8, 1, '2026-11-04 14:45:00', '2026-12-28', '2026-12-31', NULL, 'Pendiente'),
(3, 2, '2026-11-05 11:20:00', '2026-11-20', '2026-11-20', 'Tramite personal', 'Pendiente'),
(7, 3, '2026-11-05 15:30:00', NULL, NULL, 'Constancia para el banco', 'Pendiente'),
(1, 1, '2026-11-06 08:10:00', '2026-12-07', '2026-12-11', NULL, 'Pendiente');

INSERT INTO etapa_solicitud
(id_solicitud, id_rol, nombre_etapa, orden, estado, fecha_inicio, fecha_resolucion, decision, comentario, id_usuario_responsable)
VALUES
-- 1: vacaciones de Nelson (Analista -> Gerente -> Jefe) - aprobada
(1, 3, 'Analista de Nómina', 1, 'Aprobada', '2026-09-01 09:00:00', '2026-09-02 08:00:00', 'Aprobada', NULL, 3),
(1, 4, 'Gerente', 2, 'Aprobada', '2026-09-02 08:00:00', '2026-09-03 10:00:00', 'Aprobada', NULL, 4),
(1, 2, 'Jefe inmediato', 3, 'Aprobada', '2026-09-03 10:00:00', '2026-09-04 15:00:00', 'Aprobada', NULL, 2),
-- 2: permiso de Carlos (Analista) - rechazada
(2, 3, 'Analista de Nómina', 1, 'Rechazada', '2026-09-20 10:00:00', '2026-09-21 08:00:00', 'Rechazada', 'Falta el comprobante de la cita', 3),
-- 3: permiso de Nelson (Jefe -> Analista) - aprobada
(3, 2, 'Jefe inmediato', 1, 'Aprobada', '2026-10-05 08:30:00', '2026-10-06 07:30:00', 'Aprobada', NULL, 2),
(3, 3, 'Analista de Nómina', 2, 'Aprobada', '2026-10-06 07:30:00', '2026-10-07 09:30:00', 'Aprobada', NULL, 3),
-- 4: vacaciones de David (Analista) - aprobada
(4, 3, 'Analista de Nómina', 1, 'Aprobada', '2026-10-12 14:00:00', '2026-10-13 13:00:00', 'Aprobada', NULL, 3),
-- 5: permiso de Sara (Jefe -> Gerente) - rechazada
(5, 2, 'Jefe inmediato', 1, 'Rechazada', '2026-10-15 11:00:00', '2026-10-16 09:00:00', 'Rechazada', 'Coincide con el cierre de planilla', 2),
(5, 4, 'Gerente (revisión final)', 2, 'Bloqueada', NULL, NULL, NULL, NULL, NULL),
-- 6: vacaciones de María (Analista -> Gerente -> Jefe) - aprobada
(6, 3, 'Analista de Nómina', 1, 'Aprobada', '2026-01-08 08:15:00', '2026-01-09 07:15:00', 'Aprobada', NULL, 3),
(6, 4, 'Gerente', 2, 'Aprobada', '2026-01-09 07:15:00', '2026-01-10 09:15:00', 'Aprobada', NULL, 4),
(6, 2, 'Jefe inmediato', 3, 'Aprobada', '2026-01-10 09:15:00', '2026-01-11 14:15:00', 'Aprobada', NULL, 2),
-- 7: permiso de José (Jefe -> Analista) - aprobada
(7, 2, 'Jefe inmediato', 1, 'Aprobada', '2026-01-20 13:40:00', '2026-01-21 12:40:00', 'Aprobada', NULL, 2),
(7, 3, 'Analista de Nómina', 2, 'Aprobada', '2026-01-21 12:40:00', '2026-01-22 14:40:00', 'Aprobada', NULL, 3),
-- 8: constancia de Karla (Jefe -> Analista) - aprobada
(8, 2, 'Jefe inmediato', 1, 'Aprobada', '2026-02-03 10:05:00', '2026-02-04 09:05:00', 'Aprobada', NULL, 2),
(8, 3, 'Analista de Nómina', 2, 'Aprobada', '2026-02-04 09:05:00', '2026-02-05 11:05:00', 'Aprobada', NULL, 3),
-- 9: vacaciones de Lily (Analista -> Gerente -> Jefe) - aprobada
(9, 3, 'Analista de Nómina', 1, 'Aprobada', '2026-02-10 09:30:00', '2026-02-11 08:30:00', 'Aprobada', NULL, 3),
(9, 4, 'Gerente', 2, 'Aprobada', '2026-02-11 08:30:00', '2026-02-12 10:30:00', 'Aprobada', NULL, 4),
(9, 2, 'Jefe inmediato', 3, 'Aprobada', '2026-02-12 10:30:00', '2026-02-13 15:30:00', 'Aprobada', NULL, 2),
-- 10: permiso de Neftalí (Jefe -> Analista) - rechazada
(10, 2, 'Jefe inmediato', 1, 'Aprobada', '2026-02-18 15:20:00', '2026-02-19 14:20:00', 'Aprobada', NULL, 2),
(10, 3, 'Analista de Nómina', 2, 'Rechazada', '2026-02-19 14:20:00', '2026-02-20 12:20:00', 'Rechazada', 'No presento comprobante', 3),
-- 11: vacaciones de José (Analista -> Gerente -> Jefe) - aprobada
(11, 3, 'Analista de Nómina', 1, 'Aprobada', '2026-03-02 08:50:00', '2026-03-03 07:50:00', 'Aprobada', NULL, 3),
(11, 4, 'Gerente', 2, 'Aprobada', '2026-03-03 07:50:00', '2026-03-04 09:50:00', 'Aprobada', NULL, 4),
(11, 2, 'Jefe inmediato', 3, 'Aprobada', '2026-03-04 09:50:00', '2026-03-05 14:50:00', 'Aprobada', NULL, 2),
-- 12: constancia de Nelson (Jefe -> Analista) - aprobada
(12, 2, 'Jefe inmediato', 1, 'Aprobada', '2026-03-11 11:10:00', '2026-03-12 10:10:00', 'Aprobada', NULL, 2),
(12, 3, 'Analista de Nómina', 2, 'Aprobada', '2026-03-12 10:10:00', '2026-03-13 12:10:00', 'Aprobada', NULL, 3),
-- 13: permiso de María (Jefe -> Analista) - aprobada
(13, 2, 'Jefe inmediato', 1, 'Aprobada', '2026-03-25 14:00:00', '2026-03-26 13:00:00', 'Aprobada', NULL, 2),
(13, 3, 'Analista de Nómina', 2, 'Aprobada', '2026-03-26 13:00:00', '2026-03-27 15:00:00', 'Aprobada', NULL, 3),
-- 14: vacaciones de Carlos (Analista -> Gerente) - aprobada
(14, 3, 'Analista de Nómina', 1, 'Aprobada', '2026-04-06 09:00:00', '2026-04-07 08:00:00', 'Aprobada', NULL, 3),
(14, 4, 'Gerente', 2, 'Aprobada', '2026-04-07 08:00:00', '2026-04-08 10:00:00', 'Aprobada', NULL, 4),
-- 15: permiso de Karla (Jefe -> Analista) - aprobada
(15, 2, 'Jefe inmediato', 1, 'Aprobada', '2026-04-15 16:30:00', '2026-04-16 15:30:00', 'Aprobada', NULL, 2),
(15, 3, 'Analista de Nómina', 2, 'Aprobada', '2026-04-16 15:30:00', '2026-04-17 17:30:00', 'Aprobada', NULL, 3),
-- 16: vacaciones de Neftalí (Analista -> Gerente -> Jefe) - rechazada
(16, 3, 'Analista de Nómina', 1, 'Rechazada', '2026-05-04 10:45:00', '2026-05-05 08:45:00', 'Rechazada', 'Coincide con el cambio de servidores', 3),
(16, 4, 'Gerente', 2, 'Bloqueada', NULL, NULL, NULL, NULL, NULL),
(16, 2, 'Jefe inmediato', 3, 'Bloqueada', NULL, NULL, NULL, NULL, NULL),
-- 17: vacaciones de Sara (Gerente -> Jefe) - aprobada
(17, 4, 'Gerente', 1, 'Aprobada', '2026-05-12 08:20:00', '2026-05-13 07:20:00', 'Aprobada', NULL, 4),
(17, 2, 'Jefe inmediato', 2, 'Aprobada', '2026-05-13 07:20:00', '2026-05-14 09:20:00', 'Aprobada', NULL, 2),
-- 18: permiso de Lily (Jefe -> Analista) - aprobada
(18, 2, 'Jefe inmediato', 1, 'Aprobada', '2026-06-01 09:10:00', '2026-06-02 08:10:00', 'Aprobada', NULL, 2),
(18, 3, 'Analista de Nómina', 2, 'Aprobada', '2026-06-02 08:10:00', '2026-06-03 10:10:00', 'Aprobada', NULL, 3),
-- 19: constancia de José (Jefe -> Analista) - aprobada
(19, 2, 'Jefe inmediato', 1, 'Aprobada', '2026-06-09 13:00:00', '2026-06-10 12:00:00', 'Aprobada', NULL, 2),
(19, 3, 'Analista de Nómina', 2, 'Aprobada', '2026-06-10 12:00:00', '2026-06-11 14:00:00', 'Aprobada', NULL, 3),
-- 20: vacaciones de María (Analista -> Gerente -> Jefe) - aprobada
(20, 3, 'Analista de Nómina', 1, 'Aprobada', '2026-06-22 11:30:00', '2026-06-23 10:30:00', 'Aprobada', NULL, 3),
(20, 4, 'Gerente', 2, 'Aprobada', '2026-06-23 10:30:00', '2026-06-24 12:30:00', 'Aprobada', NULL, 4),
(20, 2, 'Jefe inmediato', 3, 'Aprobada', '2026-06-24 12:30:00', '2026-06-25 17:30:00', 'Aprobada', NULL, 2),
-- 21: permiso de Nelson (Jefe -> Analista) - rechazada
(21, 2, 'Jefe inmediato', 1, 'Rechazada', '2026-07-08 08:00:00', '2026-07-09 06:00:00', 'Rechazada', 'Hay inventario ese dia', 2),
(21, 3, 'Analista de Nómina', 2, 'Bloqueada', NULL, NULL, NULL, NULL, NULL),
-- 22: vacaciones de Karla (Analista -> Gerente -> Jefe) - aprobada
(22, 3, 'Analista de Nómina', 1, 'Aprobada', '2026-07-20 15:15:00', '2026-07-21 14:15:00', 'Aprobada', NULL, 3),
(22, 4, 'Gerente', 2, 'Aprobada', '2026-07-21 14:15:00', '2026-07-22 16:15:00', 'Aprobada', NULL, 4),
(22, 2, 'Jefe inmediato', 3, 'Aprobada', '2026-07-22 16:15:00', '2026-07-23 21:15:00', 'Aprobada', NULL, 2),
-- 23: constancia de Neftalí (Jefe -> Analista) - aprobada
(23, 2, 'Jefe inmediato', 1, 'Aprobada', '2026-08-05 10:00:00', '2026-08-06 09:00:00', 'Aprobada', NULL, 2),
(23, 3, 'Analista de Nómina', 2, 'Aprobada', '2026-08-06 09:00:00', '2026-08-07 11:00:00', 'Aprobada', NULL, 3),
-- 24: vacaciones de Lily (Analista -> Gerente -> Jefe) - rechazada
(24, 3, 'Analista de Nómina', 1, 'Aprobada', '2026-08-17 09:40:00', '2026-08-18 08:40:00', 'Aprobada', NULL, 3),
(24, 4, 'Gerente', 2, 'Rechazada', '2026-08-18 08:40:00', '2026-08-19 06:40:00', 'Rechazada', 'Cierre de planilla en esas fechas', 4),
(24, 2, 'Jefe inmediato', 3, 'Bloqueada', NULL, NULL, NULL, NULL, NULL),
-- 25: constancia de Carlos (Analista) - aprobada
(25, 3, 'Analista de Nómina', 1, 'Aprobada', '2026-09-03 14:25:00', '2026-09-04 13:25:00', 'Aprobada', NULL, 3),
-- 26: permiso de Karla (Jefe -> Analista) - aprobada
(26, 2, 'Jefe inmediato', 1, 'Aprobada', '2026-09-15 08:35:00', '2026-09-16 07:35:00', 'Aprobada', NULL, 2),
(26, 3, 'Analista de Nómina', 2, 'Aprobada', '2026-09-16 07:35:00', '2026-09-17 09:35:00', 'Aprobada', NULL, 3),
-- 27: permiso de José (Jefe -> Analista) - aprobada
(27, 2, 'Jefe inmediato', 1, 'Aprobada', '2026-10-02 10:20:00', '2026-10-03 09:20:00', 'Aprobada', NULL, 2),
(27, 3, 'Analista de Nómina', 2, 'Aprobada', '2026-10-03 09:20:00', '2026-10-04 11:20:00', 'Aprobada', NULL, 3),
-- 28: vacaciones de Neftalí (Analista -> Gerente -> Jefe) - aprobada
(28, 3, 'Analista de Nómina', 1, 'Aprobada', '2026-10-14 09:05:00', '2026-10-15 08:05:00', 'Aprobada', NULL, 3),
(28, 4, 'Gerente', 2, 'Aprobada', '2026-10-15 08:05:00', '2026-10-16 10:05:00', 'Aprobada', NULL, 4),
(28, 2, 'Jefe inmediato', 3, 'Aprobada', '2026-10-16 10:05:00', '2026-10-17 15:05:00', 'Aprobada', NULL, 2),
-- 29: constancia de María (Jefe -> Analista) - rechazada
(29, 2, 'Jefe inmediato', 1, 'Aprobada', '2026-10-21 16:00:00', '2026-10-22 15:00:00', 'Aprobada', NULL, 2),
(29, 3, 'Analista de Nómina', 2, 'Rechazada', '2026-10-22 15:00:00', '2026-10-23 13:00:00', 'Rechazada', 'Ya se emitio una este mes', 3),
-- 30: vacaciones de Nelson (Analista -> Gerente -> Jefe) - pendiente
(30, 3, 'Analista de Nómina', 1, 'Aprobada', '2026-11-02 08:30:00', '2026-11-03 07:30:00', 'Aprobada', NULL, 3),
(30, 4, 'Gerente', 2, 'Pendiente', '2026-11-03 07:30:00', NULL, NULL, NULL, NULL),
(30, 2, 'Jefe inmediato', 3, 'Bloqueada', NULL, NULL, NULL, NULL, NULL),
-- 31: vacaciones de Karla (Analista -> Gerente -> Jefe) - pendiente
(31, 3, 'Analista de Nómina', 1, 'Pendiente', '2026-11-03 10:00:00', NULL, NULL, NULL, NULL),
(31, 4, 'Gerente', 2, 'Bloqueada', NULL, NULL, NULL, NULL, NULL),
(31, 2, 'Jefe inmediato', 3, 'Bloqueada', NULL, NULL, NULL, NULL, NULL),
-- 32: permiso de Lily (Jefe -> Analista) - pendiente
(32, 2, 'Jefe inmediato', 1, 'Pendiente', '2026-11-04 09:15:00', NULL, NULL, NULL, NULL),
(32, 3, 'Analista de Nómina', 2, 'Bloqueada', NULL, NULL, NULL, NULL, NULL),
-- 33: vacaciones de José (Analista -> Gerente -> Jefe) - pendiente
(33, 3, 'Analista de Nómina', 1, 'Aprobada', '2026-11-04 14:45:00', '2026-11-05 13:45:00', 'Aprobada', NULL, 3),
(33, 4, 'Gerente', 2, 'Aprobada', '2026-11-05 13:45:00', '2026-11-06 15:45:00', 'Aprobada', NULL, 4),
(33, 2, 'Jefe inmediato', 3, 'Pendiente', '2026-11-06 15:45:00', NULL, NULL, NULL, NULL),
-- 34: permiso de Sara (Jefe -> Gerente) - pendiente
(34, 2, 'Jefe inmediato', 1, 'Aprobada', '2026-11-05 11:20:00', '2026-11-06 10:20:00', 'Aprobada', NULL, 2),
(34, 4, 'Gerente (revisión final)', 2, 'Pendiente', '2026-11-06 10:20:00', NULL, NULL, NULL, NULL),
-- 35: constancia de María (Jefe -> Analista) - pendiente
(35, 2, 'Jefe inmediato', 1, 'Pendiente', '2026-11-05 15:30:00', NULL, NULL, NULL, NULL),
(35, 3, 'Analista de Nómina', 2, 'Bloqueada', NULL, NULL, NULL, NULL, NULL),
-- 36: vacaciones de Carlos (Analista -> Gerente) - pendiente
(36, 3, 'Analista de Nómina', 1, 'Aprobada', '2026-11-06 08:10:00', '2026-11-07 07:10:00', 'Aprobada', NULL, 3),
(36, 4, 'Gerente', 2, 'Pendiente', '2026-11-07 07:10:00', NULL, NULL, NULL, NULL);