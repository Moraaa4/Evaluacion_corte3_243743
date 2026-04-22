CREATE OR REPLACE VIEW v_mascotas_vacunacion_pendiente AS
SELECT 
    m.id AS mascota_id,
    m.nombre AS nombre_mascota,
    m.especie,
    d.nombre AS nombre_dueno,
    d.telefono AS telefono_dueno,
    uv.ultima_vacuna,
    CASE 
        WHEN uv.ultima_vacuna IS NULL THEN 9999
        ELSE (CURRENT_DATE - uv.ultima_vacuna)::INT
    END AS dias_sin_vacuna,
    CASE 
        WHEN uv.ultima_vacuna IS NULL THEN 'NUNCA VACUNADA'
        ELSE 'VACUNACIÓN VENCIDA'
    END AS estado
FROM mascotas m
LEFT JOIN duenos d ON m.dueno_id = d.id
LEFT JOIN (
    SELECT mascota_id, MAX(fecha_aplicacion) AS ultima_vacuna
    FROM vacunas_aplicadas
    GROUP BY mascota_id
) uv ON m.id = uv.mascota_id
WHERE uv.ultima_vacuna IS NULL 
   OR (CURRENT_DATE - uv.ultima_vacuna) > 365;
