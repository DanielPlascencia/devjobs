const passport = require("passport");
const mongoose = require("mongoose");
const Vacante = mongoose.model("Vacante");
const Usuarios = mongoose.model("Usuarios");
const crypto = require("crypto");
const enviarEmail = require("../handlers/email.handler");

const autenticarUsuario = passport.authenticate("local", {
  successRedirect: "/administracion",
  failureRedirect: "/iniciar-sesion",
  failureFlash: true,
  badRequestMessage: "Todos los campos son obligatorios",
});

// Revisar si el usuario esta autenticado o no, redireccionarlo.
const verificarUsuario = (req, res, next) => {
  // Revisar el usuario.
  if (req.isAuthenticated()) {
    return next(); // Estan autenticados
  }

  // Redireccionar.
  res.redirect("/iniciar-sesion");
};

const mostrarPanel = async (req, res) => {
  // Consultar el usuario autenticado.
  const vacantes = await Vacante.find({ autor: req.user._id });

  res.render("administracion", {
    nombrePagina: "Panel de Administración",
    tagLine: "Crea y Administra tus vacantes desde aquí",
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
    vacantes,
  });
};

const cerrarSesion = (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash("correcto", "Cerraste Sesión Correctamente");
    return res.redirect("/iniciar-sesion");
  });
};

// Formulario para reestablecer el password.
const formResetearPassword = (req, res) => {
  res.render("reestablecer-password", {
    nombrePagina: "Resetear Contraseña",
    tagLine: "Reestablece la contraseña de tu cuenta",
  });
};

// Enviar token en la tabla del usuario.
const enviarToken = async (req, res) => {
  const usuario = await Usuarios.findOne({ email: req.body.email });

  if (!usuario) {
    req.flash("error", "Usuario no encontrado");
    return res.redirect("/iniciar-sesion");
  }

  // El usuario existe, generar token.
  usuario.token = crypto.randomBytes(20).toString("hex");
  usuario.expira = Date.now() + 3600000;

  // Guardar el usuario.
  await usuario.save();

  const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`;
  console.log(resetUrl);

  // Enviar notificación por email.
  await enviarEmail.enviar({
    usuario,
    subject: "Password Reset",
    resetUrl,
    archivo: "reset",
  });

  req.flash("correcto", "Revisa tu email para las indicaciones ");
  res.redirect("/iniciar-sesion");
};

// Valida si el token es valido y el usuario existe.
const reestablecerPassword = async (req, res) => {
  const usuario = await Usuarios.findOne({
    token: req.params.token,
    expira: { $gt: Date.now() },
  });

  if (!usuario) {
    req.flash("error", "El formulario no es valido");
    return res.redirect("/reestablecer-password");
  }

  res.render("nuevo-password", {
    nombrePagina: "Modifica Contraseña",
  });
};

// Almacena el nuevo password en la DB.
const guardarPassword = async (req, res) => {
  const usuario = await Usuarios.findOne({
    token: req.params.token,
    expira: { $gt: Date.now() },
  });

  // No existe el usuario o el token es invalido.
  if (!usuario) {
    req.flash("error", "El formulario no es valido");
    return res.redirect("/reestablecer-password");
  }

  // Asignar nuevo password y limpiar valores.
  usuario.password = req.body.password;
  usuario.token = undefined;
  usuario.expira = undefined;

  // Guardar en la DB.
  await usuario.save();

  // Reedirigir.
  req.flash("correcto", "Contraseña actualizada correctamente");
  res.redirect("/iniciar-sesion");
};

module.exports = {
  autenticarUsuario,
  verificarUsuario,
  mostrarPanel,
  cerrarSesion,
  formResetearPassword,
  enviarToken,
  reestablecerPassword,
  guardarPassword,
};
