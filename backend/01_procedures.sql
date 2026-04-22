CREATE OR REPLACE PROCEDURE sp_agendar_cita(
    p_mascota_id     INT,
    p_veterinario_id INT,
    p_fecha_hora     TIMESTAMP,
    p_motivo         TEXT,
    OUT p_cita_id    INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_activo BOOLEAN;
    v_dias_descanso VARCHAR;
    v_dia_semana VARCHAR;
    v_existe_mascota BOOLEAN;
BEGIN
    -- 1. Verificar que el veterinario existe y está activo
    SELECT activo, dias_descanso INTO v_activo, v_dias_descanso
    FROM veterinarios
    WHERE id = p_veterinario_id;

    IF NOT FOUND OR v_activo = FALSE THEN
        RAISE EXCEPTION 'Veterinario no encontrado o inactivo';
    END IF;

    -- 2. Obtener días de descanso y manejar NULL
    IF v_dias_descanso IS NULL THEN
        v_dias_descanso := '';
    END IF;

    -- Convertir a día de la semana (minúsculas y sin espacios)
    v_dia_semana := lower(trim(to_char(p_fecha_hora, 'TMDay')));
    -- Nota: Usamos 'TMDay' para asegurar que el idioma sea local (español) independientemente de la configuración por defecto, 
    -- o alternativamente se puede usar 'Day' si el servidor tiene lc_time='es_ES.UTF-8'
    
    IF v_dia_semana = ANY(string_to_array(v_dias_descanso, ',')) THEN
        RAISE EXCEPTION 'El veterinario descansa este día: %', v_dia_semana;
    END IF;

    -- 3. Verificar que la mascota existe
    SELECT EXISTS (SELECT 1 FROM mascotas WHERE id = p_mascota_id) INTO v_existe_mascota;
    
    IF NOT v_existe_mascota THEN
        RAISE EXCEPTION 'Mascota no encontrada';
    END IF;

    -- 4. Insertar cita
    INSERT INTO citas (mascota_id, veterinario_id, fecha_hora, motivo, estado)
    VALUES (p_mascota_id, p_veterinario_id, p_fecha_hora, p_motivo, 'AGENDADA')
    RETURNING id INTO p_cita_id;

EXCEPTION
    WHEN P0001 THEN
        -- Relanzar nuestras propias excepciones generadas
        RAISE;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error inesperado al agendar cita: %', SQLERRM;
END;
$$;
