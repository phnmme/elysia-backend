import { Elysia } from "elysia";  
import { studentsAuthorizedService } from "./students.authorized.service"; 
 
const service = new studentsAuthorizedService(); 
 
export const studentsAuthorizedController = new Elysia().group( 
  "/api/v1/students/authorized", 
  (app) =
    app.get("/", () =
    return app; 
  } 
); 
