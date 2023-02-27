const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const Usuarios = mongoose.model("Usuarios");

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      const usuario = await Usuarios.findOne({ email });
      if (!usuario)
        return done(null, false, { message: "Usuario no encontrado" });

      // El usuario existe, verificarlo.
      const verificarPass = usuario.compararPassword(password);
      if (!verificarPass)
        return done(null, false, { message: "Password Incorrecto" });

      // Usuario existe y el password es correcto.
      return done(null, usuario);
    }
  )
);

passport.serializeUser((usuario, donde) => donde(null, usuario._id));

passport.deserializeUser(async (id, donde) => {
  const usuario = await Usuarios.findById(id);
  return donde(null, usuario);
});

module.exports = passport;
