@echo off
set /p name=Enter the name: 

REM ===== GUEST =====
mkdir src\api\v1\%name%\guest

REM Controller
echo import { Elysia } from "elysia";  > src\api\v1\%name%\guest\%name%.guest.controller.ts
echo import { %name%GuestService } from "./%name%.guest.service"; >> src\api\v1\%name%\guest\%name%.guest.controller.ts
echo. >> src\api\v1\%name%\guest\%name%.guest.controller.ts
echo const service = new %name%GuestService(); >> src\api\v1\%name%\guest\%name%.guest.controller.ts
echo. >> src\api\v1\%name%\guest\%name%.guest.controller.ts
echo export const %name%GuestController = new Elysia().group( >> src\api\v1\%name%\guest\%name%.guest.controller.ts
echo   "/api/v1/%name%/guest", >> src\api\v1\%name%\guest\%name%.guest.controller.ts
echo   (app^) => { >> src\api\v1\%name%\guest\%name%.guest.controller.ts
echo     app.get("/", () => service.getAll()); >> src\api\v1\%name%\guest\%name%.guest.controller.ts
echo     return app; >> src\api\v1\%name%\guest\%name%.guest.controller.ts
echo   } >> src\api\v1\%name%\guest\%name%.guest.controller.ts
echo ); >> src\api\v1\%name%\guest\%name%.guest.controller.ts

REM Service
echo export class %name%GuestService { > src\api\v1\%name%\guest\%name%.guest.service.ts
echo   getAll() { >> src\api\v1\%name%\guest\%name%.guest.service.ts
echo     return { message: "%name% guest service working!" }; >> src\api\v1\%name%\guest\%name%.guest.service.ts
echo   } >> src\api\v1\%name%\guest\%name%.guest.service.ts
echo } >> src\api\v1\%name%\guest\%name%.guest.service.ts

REM ===== AUTHORIZED =====
mkdir src\api\v1\%name%\authorized

REM Controller
echo import { Elysia } from "elysia";  > src\api\v1\%name%\authorized\%name%.authorized.controller.ts
echo import { %name%AuthorizedService } from "./%name%.authorized.service"; >> src\api\v1\%name%\authorized\%name%.authorized.controller.ts
echo. >> src\api\v1\%name%\authorized\%name%.authorized.controller.ts
echo const service = new %name%AuthorizedService(); >> src\api\v1\%name%\authorized\%name%.authorized.controller.ts
echo. >> src\api\v1\%name%\authorized\%name%.authorized.controller.ts
echo export const %name%AuthorizedController = new Elysia().group( >> src\api\v1\%name%\authorized\%name%.authorized.controller.ts
echo   "/api/v1/%name%/authorized", >> src\api\v1\%name%\authorized\%name%.authorized.controller.ts
echo   (app^) => { >> src\api\v1\%name%\authorized\%name%.authorized.controller.ts
echo     app.get("/", () => service.getAll()); >> src\api\v1\%name%\authorized\%name%.authorized.controller.ts
echo     return app; >> src\api\v1\%name%\authorized\%name%.authorized.controller.ts
echo   } >> src\api\v1\%name%\authorized\%name%.authorized.controller.ts
echo ); >> src\api\v1\%name%\authorized\%name%.authorized.controller.ts

REM Service
echo export class %name%AuthorizedService { > src\api\v1\%name%\authorized\%name%.authorized.service.ts
echo   getAll() { >> src\api\v1\%name%\authorized\%name%.authorized.service.ts
echo     return { message: "%name% authorized service working!" }; >> src\api\v1\%name%\authorized\%name%.authorized.service.ts
echo   } >> src\api\v1\%name%\authorized\%name%.authorized.service.ts
echo } >> src\api\v1\%name%\authorized\%name%.authorized.service.ts

@REM REM ===== RESTRICTED =====
@REM mkdir src\api\v1\%name%\restricted

@REM REM Controller
@REM echo import { Elysia } from "elysia";  > src\api\v1\%name%\restricted\%name%.restricted.controller.ts
@REM echo import { %name%RestrictedService } from "./%name%.restricted.service"; >> src\api\v1\%name%\restricted\%name%.restricted.controller.ts
@REM echo. >> src\api\v1\%name%\restricted\%name%.restricted.controller.ts
@REM echo const service = new %name%RestrictedService(); >> src\api\v1\%name%\restricted\%name%.restricted.controller.ts
@REM echo. >> src\api\v1\%name%\restricted\%name%.restricted.controller.ts
@REM echo export const %name%RestrictedController = new Elysia().group( >> src\api\v1\%name%\restricted\%name%.restricted.controller.ts
@REM echo   "/api/v1/%name%/restricted", >> src\api\v1\%name%\restricted\%name%.restricted.controller.ts
@REM echo   (app^) => { >> src\api\v1\%name%\restricted\%name%.restricted.controller.ts
@REM echo     app.get("/", () => service.getAll()); >> src\api\v1\%name%\restricted\%name%.restricted.controller.ts
@REM echo     return app; >> src\api\v1\%name%\restricted\%name%.restricted.controller.ts
@REM echo   } >> src\api\v1\%name%\restricted\%name%.restricted.controller.ts
@REM echo ); >> src\api\v1\%name%\restricted\%name%.restricted.controller.ts

@REM REM Service
@REM echo export class %name%RestrictedService { > src\api\v1\%name%\restricted\%name%.restricted.service.ts
@REM echo   getAll() { >> src\api\v1\%name%\restricted\%name%.restricted.service.ts
@REM echo     return { message: "%name% restricted service working!" }; >> src\api\v1\%name%\restricted\%name%.restricted.service.ts
@REM echo   } >> src\api\v1\%name%\restricted\%name%.restricted.service.ts
@REM echo } >> src\api\v1\%name%\restricted\%name%.restricted.service.ts

@REM REM ===== INTERNAL =====
@REM mkdir src\api\v1\%name%\internal

@REM REM Controller
@REM echo import { Elysia } from "elysia";  > src\api\v1\%name%\internal\%name%.internal.controller.ts
@REM echo import { %name%InternalService } from "./%name%.internal.service"; >> src\api\v1\%name%\internal\%name%.internal.controller.ts
@REM echo. >> src\api\v1\%name%\internal\%name%.internal.controller.ts
@REM echo const service = new %name%InternalService(); >> src\api\v1\%name%\internal\%name%.internal.controller.ts
@REM echo. >> src\api\v1\%name%\internal\%name%.internal.controller.ts
@REM echo export const %name%InternalController = new Elysia().group( >> src\api\v1\%name%\internal\%name%.internal.controller.ts
@REM echo   "/api/v1/%name%/internal", >> src\api\v1\%name%\internal\%name%.internal.controller.ts
@REM echo   (app^) => { >> src\api\v1\%name%\internal\%name%.internal.controller.ts
@REM echo     app.get("/", () => service.getAll()); >> src\api\v1\%name%\internal\%name%.internal.controller.ts
@REM echo     return app; >> src\api\v1\%name%\internal\%name%.internal.controller.ts
@REM echo   } >> src\api\v1\%name%\internal\%name%.internal.controller.ts
@REM echo ); >> src\api\v1\%name%\internal\%name%.internal.controller.ts

@REM REM Service
@REM echo export class %name%InternalService { > src\api\v1\%name%\internal\%name%.internal.service.ts
@REM echo   getAll() { >> src\api\v1\%name%\internal\%name%.internal.service.ts
@REM echo     return { message: "%name% internal service working!" }; >> src\api\v1\%name%\internal\%name%.internal.service.ts
@REM echo   } >> src\api\v1\%name%\internal\%name%.internal.service.ts
@REM echo } >> src\api\v1\%name%\internal\%name%.internal.service.ts

echo.
echo ✅ Generation complete for: %name%
pause
