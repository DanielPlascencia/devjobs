const express = require("express");
const router = express.Router();
const { mostrarTrabajos } = require("../controllers/home.controller");
const {
  formularioNuevaVacante,
  agregarVacante,
  mostrarVacante,
  formEditarVacante,
  editarVacante,
  eliminarVacante,
  validarVacante,
  subirCV,
  contactar,
  mostrarCandidatos,
  buscarVacantes,
} = require("../controllers/vacantes.controller");

const {
  formCrearCuenta,
  validarRegistro,
  crearUsuario,
  formIniciarSesion,
  formEditarPerfil,
  editarPerfil,
  validarPerfil,
  subirImagen,
} = require("../controllers/usuarios.controller");

const {
  autenticarUsuario,
  verificarUsuario,
  mostrarPanel,
  cerrarSesion,
  formResetearPassword,
  enviarToken,
  reestablecerPassword,
  guardarPassword,
} = require("../controllers/auth.controller");

module.exports = () => {
  router.get("/", mostrarTrabajos);

  // Crear Vacantes.
  router.get("/vacantes/nueva", verificarUsuario, formularioNuevaVacante);
  router.post(
    "/vacantes/nueva",
    verificarUsuario,
    validarVacante,
    agregarVacante
  );

  // Mostrar vacante.
  router.get("/vacantes/:url", mostrarVacante);

  // Editar vacante.
  router.get("/vacantes/editar/:url", verificarUsuario, formEditarVacante);
  router.post(
    "/vacantes/editar/:url",
    verificarUsuario,
    validarVacante,
    editarVacante
  );

  // Eliminar vacante.
  router.delete("/vacantes/eliminar/:id", eliminarVacante);

  // Crear cuentas
  router.get("/crear-cuenta", formCrearCuenta);
  router.post("/crear-cuenta", validarRegistro, crearUsuario);

  // Autenticar Usuarios.
  router.get("/iniciar-sesion", formIniciarSesion);
  router.post("/iniciar-sesion", autenticarUsuario);

  // Cerrar Sesión.
  router.get("/cerrar-sesion", cerrarSesion);

  // Resetear password.
  router.get("/reestablecer-password", formResetearPassword);
  router.post("/reestablecer-password", enviarToken);

  // Resetear password (Almacenar en la DB.)
  router.get("/reestablecer-password/:token", reestablecerPassword);
  router.post("/reestablecer-password/:token", guardarPassword);

  // Panel de administración.
  router.get("/administracion", verificarUsuario, mostrarPanel);

  // Editar Perfil.
  router.get("/editar-perfil", verificarUsuario, formEditarPerfil);
  router.post(
    "/editar-perfil",
    verificarUsuario,
    /*validarPerfil,*/
    subirImagen,
    editarPerfil
  );

  // Recibir Mensajes de Candidatos.
  router.post("/vacantes/:url", subirCV, contactar);

  // Muestra los candidatos por vacante.
  router.get("/candidatos/:id", verificarUsuario, mostrarCandidatos);

  // Buscador de Vacantes.
  router.post("/buscador", buscarVacantes);

  return router;
};
