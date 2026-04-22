-- ====================================================================
-- 1. TRIGGER: trg_historial_cita
-- ====================================================================

-- Función Trigger
CREATE OR REPLACE FUNCTION fn_registrar_historial_cita()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO historial_movimientos (tipo, referencia_id, descripcion, fecha)
    VALUES (
        'CITA_AGENDADA',
        NEW.id,
        'Cita agendada para mascota ID: ' || NEW.mascota_id || 
        ' con veterinario ID: ' || NEW.veterinario_id || 
        ' para ' || NEW.fecha_hora::TEXT,
        NOW()
    );
    RETURN NEW;
END;
$$;

-- Trigger
DROP TRIGGER IF EXISTS trg_historial_cita ON citas;

CREATE TRIGGER trg_historial_cita
AFTER INSERT ON citas
FOR EACH ROW
EXECUTE FUNCTION fn_registrar_historial_cita();

-- ====================================================================
-- 2. FUNCIÓN: fn_total_facturado
-- ====================================================================

CREATE OR REPLACE FUNCTION fn_total_facturado(
    p_mascota_id INT,
    p_anio       INT
) RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_total NUMERIC;
BEGIN
    SELECT SUM(costo) INTO v_total
    FROM citas
    WHERE mascota_id = p_mascota_id
      AND estado = 'COMPLETADA'
      AND EXTRACT(YEAR FROM fecha_hora) = p_anio;

    IF v_total IS NULL THEN
        RETURN 0;
    END IF;

    RETURN v_total;
END;
$$;
