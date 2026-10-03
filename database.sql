-- =====================================================
-- BASE DE DATOS
-- Sistema de Gestión de Solicitudes de Recursos Humanos
-- Grupo Calma
-- =====================================================

CREATE DATABASE IF NOT EXISTS sistema_rrhh;

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
    id_usuario INT NOT NULL,
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
    estado VARCHAR(30) NOT NULL,
    fecha_inicio DATETIME NULL,
    fecha_resolucion DATETIME NULL,
    decision VARCHAR(30) NULL,
    comentario VARCHAR(500) NULL,

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