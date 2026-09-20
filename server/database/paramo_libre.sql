-- ============================================================
-- PÁRAMO LIBRE - Base de Datos MySQL
-- Versión: 1.0.0
-- Motor: MySQL 8.0+
-- Codificación: utf8mb4
-- ============================================================

-- 1. Eliminar y crear la base de datos
DROP DATABASE IF EXISTS paramo_libre;
CREATE DATABASE paramo_libre
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE paramo_libre;

-- ============================================================
-- 2. TABLA: usuarios
-- ============================================================
CREATE TABLE usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    foto_perfil VARCHAR(255) DEFAULT NULL,
    biografia TEXT DEFAULT NULL,
    ubicacion VARCHAR(150) DEFAULT NULL,
    telefono VARCHAR(20) DEFAULT NULL,
    rol ENUM('usuario', 'admin') DEFAULT 'usuario' NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    email_verificado BOOLEAN DEFAULT FALSE NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_conexion TIMESTAMP NULL DEFAULT NULL,
    reset_token VARCHAR(255) DEFAULT NULL,
    reset_token_expira TIMESTAMP NULL DEFAULT NULL,
    
    INDEX idx_email (email),
    INDEX idx_rol (rol),
    INDEX idx_activo (activo),
    INDEX idx_fecha_registro (fecha_registro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. TABLA: categorias
-- ============================================================
CREATE TABLE categorias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT DEFAULT NULL,
    icono VARCHAR(50) DEFAULT 'book',
    color VARCHAR(7) DEFAULT '#0d6efd',
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_activo (activo),
    INDEX idx_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. TABLA: libros
-- ============================================================
CREATE TABLE libros (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    categoria_id INT UNSIGNED DEFAULT NULL,
    titulo VARCHAR(200) NOT NULL,
    autor VARCHAR(150) NOT NULL,
    isbn VARCHAR(20) DEFAULT NULL,
    descripcion TEXT NOT NULL,
    estado_libro ENUM('nuevo', 'como_nuevo', 'buen_estado', 'usado', 'muy_usado') NOT NULL DEFAULT 'buen_estado',
    estado_publicacion ENUM('disponible', 'en_intercambio', 'intercambiado', 'pausado') DEFAULT 'disponible' NOT NULL,
    ubicacion VARCHAR(150) DEFAULT NULL,
    imagen_portada VARCHAR(255) DEFAULT NULL,
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    
    CONSTRAINT fk_libros_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_libros_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_categoria_id (categoria_id),
    INDEX idx_estado_publicacion (estado_publicacion),
    INDEX idx_activo (activo),
    FULLTEXT INDEX idx_busqueda (titulo, autor, descripcion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. TABLA: imagenes_libros
-- ============================================================
CREATE TABLE imagenes_libros (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    libro_id INT UNSIGNED NOT NULL,
    url_imagen VARCHAR(255) NOT NULL,
    orden INT UNSIGNED DEFAULT 0,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_imagenes_libro FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_libro_id (libro_id),
    INDEX idx_orden (orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. TABLA: intercambios (propuestas)
-- ============================================================
CREATE TABLE intercambios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    libro_solicitado_id INT UNSIGNED NOT NULL,
    libro_ofrecido_id INT UNSIGNED NOT NULL,
    solicitante_id INT UNSIGNED NOT NULL,
    receptor_id INT UNSIGNED NOT NULL,
    estado ENUM('pendiente', 'aceptado', 'rechazado', 'cancelado', 'completado') DEFAULT 'pendiente' NOT NULL,
    mensaje TEXT DEFAULT NULL,
    respuesta_mensaje TEXT DEFAULT NULL,
    fecha_propuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta TIMESTAMP NULL DEFAULT NULL,
    fecha_completado TIMESTAMP NULL DEFAULT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    
    CONSTRAINT fk_int_libro_sol FOREIGN KEY (libro_solicitado_id) REFERENCES libros(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_int_libro_ofr FOREIGN KEY (libro_ofrecido_id) REFERENCES libros(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_int_solicitante FOREIGN KEY (solicitante_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_int_receptor FOREIGN KEY (receptor_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_solicitante (solicitante_id),
    INDEX idx_receptor (receptor_id),
    INDEX idx_estado (estado),
    INDEX idx_activo (activo),
    INDEX idx_fecha_propuesta (fecha_propuesta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. TABLA: historial_intercambios (auditoría)
-- ============================================================
CREATE TABLE historial_intercambios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    intercambio_id INT UNSIGNED NOT NULL,
    estado_anterior VARCHAR(50) NOT NULL,
    estado_nuevo VARCHAR(50) NOT NULL,
    cambiado_por_id INT UNSIGNED DEFAULT NULL,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notas TEXT DEFAULT NULL,
    
    CONSTRAINT fk_hist_intercambio FOREIGN KEY (intercambio_id) REFERENCES intercambios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_hist_usuario FOREIGN KEY (cambiado_por_id) REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_intercambio_id (intercambio_id),
    INDEX idx_fecha_cambio (fecha_cambio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. TABLA: favoritos
-- ============================================================
CREATE TABLE favoritos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    libro_id INT UNSIGNED NOT NULL,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_fav_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_fav_libro FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    UNIQUE KEY uk_favorito (usuario_id, libro_id),
    INDEX idx_libro_id (libro_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. TABLA: configuraciones_usuario
-- ============================================================
CREATE TABLE configuraciones_usuario (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL UNIQUE,
    notificaciones_email BOOLEAN DEFAULT TRUE,
    tema ENUM('claro', 'oscuro', 'sistema') DEFAULT 'claro',
    privacidad_perfil ENUM('publico', 'solo_usuarios', 'privado') DEFAULT 'publico',
    idioma VARCHAR(10) DEFAULT 'es',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_conf_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. TRIGGER: Crear configuración por defecto al registrar usuario
-- ============================================================
DELIMITER //

CREATE TRIGGER trg_after_usuario_insert
AFTER INSERT ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO configuraciones_usuario (usuario_id) VALUES (NEW.id);
END//

CREATE TRIGGER trg_after_intercambio_update
AFTER UPDATE ON intercambios
FOR EACH ROW
BEGIN
    IF OLD.estado != NEW.estado THEN
        INSERT INTO historial_intercambios (
            intercambio_id, 
            estado_anterior, 
            estado_nuevo, 
            cambiado_por_id,
            notas
        ) VALUES (
            NEW.id,
            OLD.estado,
            NEW.estado,
            NULL,
            CONCAT('Cambio automático de ', OLD.estado, ' a ', NEW.estado)
        );
    END IF;
END//

DELIMITER ;

-- ============================================================
-- 11. DATOS DE PRUEBA: Categorías
-- ============================================================
INSERT INTO categorias (nombre, descripcion, icono, color) VALUES
('Novela', 'Ficción narrativa extensa con trama compleja', 'menu_book', '#0B4F6C'),
('Ciencia Ficción', 'Futurismo, tecnología y mundos imaginarios', 'rocket', '#5B2E91'),
('Fantasía', 'Magia, criaturas y mundos épicos', 'auto_fix_high', '#7B1FA2'),
('Historia', 'Eventos reales del pasado humano', 'account_balance', '#E65100'),
('Ciencia', 'Divulgación científica y académica', 'biotech', '#1B5E20'),
('Filosofía', 'Pensamiento crítico y ética', 'psychology', '#263238'),
('Arte', 'Pintura, escultura, música y cultura visual', 'palette', '#C62828'),
('Tecnología', 'Informática, programación e innovación', 'computer', '#00695C'),
('Poesía', 'Expresión literaria en verso', 'format_quote', '#AD1457'),
('Biografía', 'Vidas de personajes históricos', 'person', '#4527A0');

-- ============================================================
-- 12. DATOS DE PRUEBA: Usuarios (password: 'Password123' hasheado con BCrypt)
-- Nota: Los hashes son ejemplos. En producción se generan con bcryptjs.
-- Hash de ejemplo para Password123: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- ============================================================
INSERT INTO usuarios (nombre, email, password_hash, foto_perfil, biografia, ubicacion, telefono, rol, activo, email_verificado) VALUES
('Carlos Mendoza', 'carlos@example.com', '$2b$10$mZkao69Q4TmCZAvHtSOkR.7MBTLK3un4sMhHKf.za.LerVGRze44e', NULL, 'Amante de la literatura clásica y moderna. Siempre buscando nuevas historias.', 'Santiago de Querétaro', '4421234567', 'admin', TRUE, TRUE),
('Ana María Ríos', 'ana@example.com', '$2b$10$mZkao69Q4TmCZAvHtSOkR.7MBTLK3un4sMhHKf.za.LerVGRze44e', NULL, 'Estudiante de filosofía. Intercambio libros de pensamiento crítico.', 'Corregidora', '4429876543', 'usuario', TRUE, TRUE),
('Luis Fernando Vega', 'luis@example.com', '$2b$10$mZkao69Q4TmCZAvHtSOkR.7MBTLK3un4sMhHKf.za.LerVGRze44e', NULL, 'Ingeniero y aficionado a la ciencia ficción. Colecciono ediciones especiales.', 'San Juan del Río', '4275558899', 'usuario', TRUE, TRUE),
('Sofía Herrera', 'sofia@example.com', '$2b$10$mZkao69Q4TmCZAvHtSOkR.7MBTLK3un4sMhHKf.za.LerVGRze44e', NULL, 'Artista visual. Busco libros de arte y diseño para inspirarme.', 'El Marqués', '4424447766', 'usuario', TRUE, TRUE),
('Javier Torres', 'javier@example.com', '$2b$10$mZkao69Q4TmCZAvHtSOkR.7MBTLK3un4sMhHKf.za.LerVGRze44e', NULL, 'Historiador aficionado. Especializado en historia contemporánea.', 'Tequisquiapan', '4142223344', 'usuario', TRUE, TRUE);

-- ============================================================
-- 13. DATOS DE PRUEBA: Libros
-- ============================================================
INSERT INTO libros (usuario_id, categoria_id, titulo, autor, isbn, descripcion, estado_libro, estado_publicacion, ubicacion, imagen_portada) VALUES
(1, 1, 'Cien años de soledad', 'Gabriel García Márquez', '978-0307474728', 'La obra cumbre del realismo mágico. Disponible para trueque local.', 'buen_estado', 'disponible', 'San Juan del Río', NULL),
(1, 3, 'El nombre del viento', 'Patrick Rothfuss', '978-0756404741', 'Primera novela de la crónica del asesino de reyes. Fantasía épica en buen estado.', 'como_nuevo', 'disponible', 'San Juan del Río', NULL),
(2, 6, 'Así habló Zaratustra', 'Friedrich Nietzsche', '978-0140441185', 'Obra filosófica fundamental. Ideal para estudiantes de bachillerato o universidad.', 'usado', 'disponible', 'San Juan del Río', NULL),
(2, 1, '1984', 'George Orwell', '978-0451524935', 'Distopía clásica sobre el totalitarismo y la vigilancia. Estado impecable.', 'como_nuevo', 'disponible', 'San Juan del Río', NULL),
(3, 2, 'Dune', 'Frank Herbert', '978-0441172719', 'Épica de ciencia ficción en el desierto de Arrakis. Edición completa.', 'buen_estado', 'disponible', 'San Juan del Río', NULL),
(3, 2, 'Neuromante', 'William Gibson', '978-0441569595', 'Novela fundacional del ciberpunk. Disponible para trueque por ciencia ficción.', 'usado', 'disponible', 'San Juan del Río', NULL),
(4, 7, 'Historia del arte', 'E.H. Gombrich', '978-0714832470', 'El clásico manual de historia del arte. Con ilustraciones a color.', 'buen_estado', 'disponible', 'San Juan del Río', NULL),
(4, 7, 'Steal Like an Artist', 'Austin Kleon', '978-0761169253', 'Guía creativa para artistas. Libro pequeño con grandes ideas.', 'nuevo', 'disponible', 'San Juan del Río', NULL),
(5, 4, 'Sapiens: De animales a dioses', 'Yuval Noah Harari', '978-0062316097', 'Historia de la humanidad desde la prehistoria hasta la era moderna.', 'buen_estado', 'disponible', 'San Juan del Río', NULL),
(5, 4, 'Los derechos humanos y la civilización', 'Norberto Bobbio', '978-9505572573', 'Ensayo sobre fundamentos filosóficos de los derechos humanos.', 'usado', 'disponible', 'San Juan del Río', NULL),
(1, 5, 'Una breve historia del tiempo', 'Stephen Hawking', '978-0553380163', 'Divulgación científica sobre el origen del universo. Excelente estado.', 'como_nuevo', 'disponible', 'San Juan del Río', NULL),
(3, 8, 'Clean Code', 'Robert C. Martin', '978-0132350884', 'Manual esencial para desarrolladores de software. Con anotaciones.', 'usado', 'disponible', 'San Juan del Río', NULL);

-- ============================================================
-- 14. DATOS DE PRUEBA: Intercambios (propuestas)
-- ============================================================
INSERT INTO intercambios (libro_solicitado_id, libro_ofrecido_id, solicitante_id, receptor_id, estado, mensaje, fecha_propuesta) VALUES
(3, 1, 1, 2, 'pendiente', 'Hola Ana, me interesa mucho tu libro de Nietzsche. Te ofrezco Cien años de soledad y puedo entregar en Corregidora.', NOW()),
(5, 4, 2, 3, 'aceptado', 'Me encanta Dune. Te ofrezco 1984, está en perfecto estado. Acepto el trueque.', NOW()),
(7, 6, 3, 4, 'pendiente', 'Hola Sofía, busco tu Historia del arte. Te ofrezco Neuromante y puedo moverme a El Marqués.', NOW()),
(9, 8, 4, 5, 'completado', 'Trueque de Sapiens por Steal Like an Artist. Ambos quedamos satisfechos.', NOW()),
(11, 12, 5, 1, 'rechazado', 'Ofrezco Breve historia del tiempo por Clean Code, pero no me interesa en este momento.', NOW());

-- Actualizar fechas de respuesta para los aceptados/rechazados
UPDATE intercambios SET fecha_respuesta = NOW() WHERE estado IN ('aceptado', 'rechazado', 'completado');
UPDATE intercambios SET fecha_completado = NOW() WHERE estado = 'completado';

-- ============================================================
-- 15. DATOS DE PRUEBA: Favoritos
-- ============================================================
INSERT INTO favoritos (usuario_id, libro_id) VALUES
(1, 3),
(1, 5),
(2, 1),
(2, 6),
(3, 4),
(4, 9),
(5, 2),
(5, 11);

-- ============================================================
-- 16. VISTAS ÚTILES PARA ESTADÍSTICAS (Panel Admin)
-- ============================================================

-- Vista: Resumen de actividad
CREATE VIEW vw_resumen_plataforma AS
SELECT 
    (SELECT COUNT(*) FROM usuarios WHERE activo = TRUE) AS total_usuarios,
    (SELECT COUNT(*) FROM libros WHERE activo = TRUE AND estado_publicacion = 'disponible') AS libros_disponibles,
    (SELECT COUNT(*) FROM intercambios WHERE estado = 'completado') AS intercambios_completados,
    (SELECT COUNT(*) FROM intercambios WHERE estado = 'pendiente') AS propuestas_pendientes;

-- Vista: Libros por categoría
CREATE VIEW vw_libros_por_categoria AS
SELECT 
    c.nombre AS categoria,
    c.color,
    COUNT(l.id) AS total_libros
FROM categorias c
LEFT JOIN libros l ON c.id = l.categoria_id AND l.activo = TRUE
WHERE c.activo = TRUE
GROUP BY c.id, c.nombre, c.color
ORDER BY total_libros DESC;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
