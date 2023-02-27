const mongoose = require("mongoose");
const multer = require("multer");
const Usuarios = mongoose.model("Usuarios");
const shortId = require("shortid");

const subirImagen = (req, res, next) => {
  upload(req, res, function (error) {
    if (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          req.flash("error", "El archivo es muy grande: Máximo 100kb");
        } else {
          req.flash("error", error.message);
        }
      } else {
        req.flash("error", error.message);
      }
      res.redirect("/administracion");
      return;
    } else {
      next();
    }
  });
};

// Opciones de Multer.
const configuracionMulter = {
  limits: { fileSize: 100000 },
  storage: (fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, __dirname + "../../public/uploads/perfiles"); //Si no funciona, quitar un '../'
    },
    filename: (req, file, cb) => {
      const extension = file.mimetype.split("/")[1];
      cb(null, `${shortId.generate()}.${extension}`);
    },
  })),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      // El callback se ejecuta como true o false:  true cuando la imagen se acepta.
      cb(null, true);
    } else {
      cb(new Error("Formato No Válido"), false);
    }
  },
};

const upload = multer(configuracionMulter).single("imagen");

const formCrearCuenta = (req, res) => {
  res.render("crear-cuenta", {
    nombrePagina: "Crea tu cuenta de devJobs",
    tagline:
      "Comienza a publicar tus vacantes gratis, solo debes crear una cuenta",
  });
};

const validarRegistro = (req, res, next) => {
  // Sanitizar.
  req.sanitizeBody("nombre").escape();
  req.sanitizeBody("email").escape();
  req.sanitizeBody("password").escape();
  req.sanitizeBody("confirmar").escape();

  // Validar.
  req.checkBody("nombre", "El nombre es obligatorio").notEmpty();
  req.checkBody("email", "El email debe ser valido").isEmail();
  req.checkBody("password", "El password no debe estar vacio").notEmpty();
  req
    .checkBody("confirmar", "El password es diferente")
    .equals(req.body.password);

  const errores = req.validationErrors();
  if (errores) {
    // Si hay errores.
    req.flash(
      "error",
      errores.map((error) => error.msg)
    );

    res.render("crear-cuenta", {
      nombrePagina: "Crea tu cuenta en devJobs",
      tagline:
        "Comienza a publicar tus vacantes gratis, solo debes crear una cuenta",
      mensajes: req.flash(),
    });
    return;
  }

  // Si toda la validacion es correcta.
  next();
};

const crearUsuario = async (req, res, next) => {
  // Crear el nuevo usuario.
  const usuario = new Usuarios(req.body);

  try {
    await usuario.save();
    res.redirect("/iniciar-sesion");
  } catch (error) {
    console.log(error);
    req.flash("error", error);
    res.redirect("/crear-cuenta");
  }
};

// Formulario para iniciar sesión.
const formIniciarSesion = (req, res) => {
  res.render("iniciar-sesion", {
    nombrePagina: "Iniciar sesión, devJobs",
  });
};

// Editar el perfil.
const formEditarPerfil = (req, res) => {
  res.render("editar-perfil", {
    nombrePagina: "Editar tu perfil en devJobs",
    usuario: req.user,
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
  });
};

// Guardar cambios editar perfil.
const editarPerfil = async (req, res) => {
  const usuario = await Usuarios.findById(req.user._id);

  usuario.nombre = req.body.nombre;
  usuario.email = req.body.email;
  if (req.body.password) {
    usuario.password = req.body.password;
  }

  if (req.file) {
    usuario.imagen = req.file.filename;
  }

  await usuario.save();

  req.flash("correcto", "Cambios guardados correctamente");

  // Redirect...
  res.redirect("/administracion");
};

// Sanitizar y validar el formulario de deditar perfiles.
const validarPerfil = (req, res, next) => {
  // Sanitizar.
  req.sanitizeBody("nombre").escape();
  req.sanitizeBody("email").escape();
  if (req.body.password) {
    req.sanitizeBody("password").escape();
  }

  // Validar.
  req.checkBody("nombre", "El nombre no puede ir vacío").notEmpty();
  req.checkBody("email", "El correo no puede ir vacío").notEmpty();

  const errores = req.validationErrors();

  if (errores) {
    req.flash(
      "error",
      errores.map((error) => error.msg)
    );

    res.render("editar-perfil", {
      nombrePagina: "Edita tu perfil en devJobs",
      usuario: req.user,
      cerrarSesion: true,
      nombre: req.user.nombre,
      imagen: req.user.imagen,
      mensajes: req.flash(),
    });
    return;
  }
  next();
};

module.exports = {
  formCrearCuenta,
  validarRegistro,
  crearUsuario,
  formIniciarSesion,
  formEditarPerfil,
  editarPerfil,
  validarPerfil,
  subirImagen,
};
