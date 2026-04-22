# Clínica Veterinaria — Sistema Full-Stack con Seguridad de BD

Sistema multi-usuario de gestión veterinaria que permite agendar citas, consultar historiales de mascotas y registrar vacunaciones, aplicando controles estrictos de acceso basados en roles.

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

### Características de Seguridad
- Autenticación simulada basada en roles (Veterinario, Recepción, Administrador).
- Seguridad a Nivel de Fila (RLS) en PostgreSQL para asegurar aislamiento de datos.
- Permisos granulares de base de datos a nivel de tabla (GRANT/REVOKE).
- Invalidadación de caché en Redis para garantizar consistencia eventual.
- Consultas parametrizadas (Prepared Statements) para prevenir SQL Injection.

### Instrucciones para levantar el proyecto:
```bash
git clone https://github.com/Moraaa4/Evaluacion_corte3_243743.git
cd Evaluacion_corte3_243743
cp .env.example .env  # (Editar con tus valores y contraseñas)
docker-compose up --build -d

# Y en otra terminal, levantar el frontend:
cd frontend
npm install
npm run dev

# Abrir http://localhost:3000
```

---

## Decisiones de Diseño

**1. ¿Qué política RLS aplicaste a la tabla mascotas? Pega la cláusula exacta y explica con tus palabras qué hace.**
```sql
CREATE POLICY policy_mascotas_vet ON mascotas FOR ALL TO rol_veterinario
USING (EXISTS (
    SELECT 1 FROM vet_atiende_mascota
    WHERE vet_atiende_mascota.mascota_id = mascotas.id
    AND vet_atiende_mascota.vet_id = current_setting('app.current_vet_id', TRUE)::INT
));
```
Esta política asegura que un veterinario solo pueda ver o modificar los registros de mascotas que estén explícitamente asignados a él mediante la tabla pivote `vet_atiende_mascota`. Si un usuario con el `rol_veterinario` hace un `SELECT * FROM mascotas`, PostgreSQL filtrará silenciosamente las filas, devolviendo únicamente aquellas cuyo `id` de mascota tenga una relación con el `app.current_vet_id` en sesión.

**2. Cualquiera que sea la estrategia que elegiste para identificar al veterinario actual en RLS, tiene un vector de ataque posible. ¿Cuál es? ¿Tu sistema lo previene?**
El vector de ataque principal es que un usuario malicioso o un cliente modificado envíe un ID de veterinario falso (por ejemplo, el de otro colega) en el header `X-Vet-Id` para acceder a sus expedientes. Nuestro sistema lo mitiga validando el header en el backend; en un entorno de producción real, este ID no se leería directamente de un header libre en texto plano, sino que se extraería del payload firmado y cifrado de un JWT validado durante el proceso de autenticación, haciendo imposible falsificarlo.

**3. Si usas SECURITY DEFINER en algún procedure, ¿qué medida específica tomaste? Si no lo usas, justifica por qué no fue necesario.**
No utilizamos `SECURITY DEFINER` en ningún procedimiento almacenado. Esto se decidió para aplicar el principio de mínimo privilegio (`SECURITY INVOKER` por defecto), asegurando que el procedimiento se ejecute siempre con los permisos explícitos del usuario que lo llama (recepción o veterinario). De esta forma, las validaciones de acceso y políticas RLS siguen aplicando orgánicamente durante la ejecución del SP, evitando elevar privilegios de forma innecesaria que pudieran derivar en un bypass de seguridad de base de datos.

**4. ¿Qué TTL le pusiste al caché Redis y por qué ese valor específico? ¿Qué pasaría si fuera demasiado bajo? ¿Demasiado alto?**
Establecimos un TTL de 300 segundos (5 minutos) en Redis para la clave `vacunacion_pendiente`. Este valor es adecuado porque las listas de vacunaciones pendientes no cambian drásticamente segundo a segundo y toleran una ligera latencia de lectura, lo que descarga a la base de datos de ejecutar vistas pesadas continuamente. Si fuera demasiado bajo (ej. 5 segundos), anularíamos el propósito del caché al seguir saturando la BD; si fuera demasiado alto (ej. 24 horas), los veterinarios verían datos "fantasmas" desactualizados, lo que podría causar confusión clínica, aunque este último riesgo se mitiga al aplicar activamente `redis.del()` cuando se registra una vacuna nueva.

**5. Tu frontend manda input del usuario al backend. Elige un endpoint crítico y pega la línea exacta donde el backend maneja ese input antes de enviarlo a la BD.**
En el archivo `api/src/routes/mascotas.js`, manejamos la variable de búsqueda `nombre` de la siguiente manera:
```javascript
if (nombre) {
  queryText += ' WHERE nombre ILIKE $1';
  queryParams.push(`%${nombre}%`);
}
const result = await client.query(queryText, queryParams);
```
En lugar de concatenar el input del usuario dinámicamente en el string de SQL, pasamos el término de búsqueda a través del array `queryParams`. El driver de Postgres (`pg`) lo envía a la base de datos como un parámetro preparado (`$1`), garantizando que el texto del usuario se analice exclusivamente como un valor literal y jamás como código ejecutable.

**6. Si revocas todos los permisos del rol de veterinario excepto SELECT en mascotas, ¿qué deja de funcionar? Lista tres operaciones.**
1. **Agendar Citas:** Fallaría la inserción en la tabla `citas` (vía `CALL sp_agendar_cita`) porque el veterinario carecería del privilegio `INSERT` en esa tabla y de permisos sobre su secuencia.
2. **Aplicar Vacunas:** Fallaría guardar cualquier expediente de vacunación al recibir error de acceso denegado por falta de `INSERT` en la tabla `vacunas_aplicadas`.
3. **Ver su propio historial de citas:** Fallaría cualquier vista, consulta en la API o intento desde el frontend a la ruta GET de citas porque el veterinario ya no tendría el privilegio `SELECT` otorgado en la tabla `citas`.
