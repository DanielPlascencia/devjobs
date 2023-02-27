const mongoose = require("mongoose");
const Vacante = mongoose.model("Vacante");

const multer = require("multer");
const shortid = require("shortid");

const formularioNuevaVacante = (req, res) => {
  res.render("nueva-vacante", {
    nombrePagina: "Nueva Vacante",
    tagline: "Llena el formulario y publica tu vacante",
    usuario: req.user,
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
  });
};

// Agregar las vacantes a la base de datos.
const agregarVacante = async (req, res) => {
  const vacante = new Vacante(req.body);

  // Usuario autor de la vacante.
  vacante.autor = req.user._id;

  // Crear arreglo de skills.
  const nuevos = req.body.skills.split(",");
  const skillsSeparados = nuevos.map((nuevo) => {
    return nuevo.trim();
  });

  vacante.skills = skillsSeparados;

  // Alamacenar en la DB.
  const nuevaVacante = await vacante.save();

  // Redireccionar.
  res.redirect(`/vacantes/${nuevaVacante.url}`);
};

// Muestra una vacante.
const mostrarVacante = async (req, res, next) => {
  const vacante = await Vacante.findOne({ url: req.params.url }).populate(
    "autor"
  );
  // Si no hay resultados.
  if (!vacante) return next();

  res.render("vacante", {
    vacante,
    nombrePagina: vacante.titulo,
    barra: true,
  });
};

const formEditarVacante = async (req, res, next) => {
  const vacante = await Vacante.findOne({ url: req.params.url });

  if (!vacante) return next();

  res.render("editarVacante", {
    vacante,
    nombrePagina: `Editar - ${vacante.titulo}`,
    usuario: req.user,
    cerrarSesion: true,
    imagen: req.user.imagen,
  });
};

const editarVacante = async (req, res, next) => {
  const vacanteActualizada = req.body;
  vacanteActualizada.skills = req.body.skills.split(",");
  const skillsSeparados = vacanteActualizada.skills.map((nuevo) => {
    return nuevo.trim();
  });
  vacanteActualizada.skills = skillsSeparados;
  console.log(vacanteActualizada);

  const vacante = await Vacante.findOneAndUpdate(
    { url: req.params.url },
    vacanteActualizada,
    {
      new: true,
      runValidators: true,
    }
  );

  res.redirect(`/vacantes/${vacante.url}`);
};

const validarVacante = (req, res, next) => {
  // Sanitizar los campos.
  req.sanitize("titulo").escape();
  req.sanitize("skills").escape();
  req.sanitize("empresa").escape();
  req.sanitize("ubicacion").escape();
  req.sanitize("salario").escape();
  req.sanitize("contrato").escape();

  // Validar campos.
  req.checkBody("titulo", "Agrega un titulo a la vacante").notEmpty();
  req.checkBody("empresa", "Agrega una Empresa").notEmpty();
  req.checkBody("ubicacion", "Agrega una Ubicación").notEmpty();
  req.checkBody("contrato", "Selecciona el tipo de contrato").notEmpty();
  req.checkBody("skills", "Agrega al menos una habilidad").notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    // Recargar la vista con errores.
    req.flash(
      "error",
      errors.map((error) => error.msg)
    );

    res.render("nueva-vacante", {
      nombrePagina: "Nueva Vacante",
      tagline: "Llena el formulario y publica tu vacante",
      usuario: req.user.nombre,
      cerrarSesion: true,
      mensajes: req.flash(),
    });
    return;
  }
  next();
};

// Eliminar vacante.
const eliminarVacante = async (req, res, next) => {
  const { id } = req.params;
  const vacante = await Vacante.findById(id);

  if (verificarAutor(vacante, req.user)) {
    // Todo bien, si es el usuario, eliminar.
    vacante.remove();
    res.status(200).send("Vacante eliminada correctamente");
  } else {
    // No permitido.
    res.status(403).send("Error");
  }
};

const verificarAutor = (vacante = {}, usuario = {}) => {
  if (!vacante.autor.equals(usuario._id)) {
    return false;
  } else {
    return true;
  }
};

// Subir archivos en pdf.
const subirCV = (req, res, next) => {
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
      res.redirect("back");
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
      cb(null, __dirname + "../../public/uploads/cv"); //Si no funciona, quitar un '../'
    },
    filename: (req, file, cb) => {
      const extension = file.mimetype.split("/")[1];
      cb(null, `${shortid.generate()}.${extension}`);
    },
  })),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      // El callback se ejecuta como true o false:  true cuando la imagen se acepta.
      cb(null, true);
    } else {
      cb(new Error("Formato No Válido"), false);
    }
  },
};

const upload = multer(configuracionMulter).single("cv");

// Almacenar los candidatos en la BD.
const contactar = async (req, res, next) => {
  const vacante = await Vacante.findOne({ url: req.params.url });

  if (!vacante) return next();

  // Todo bien, construir el nuevo objeto.
  const nuevoCandidato = {
    nombre: req.body.nombre,
    email: req.body.email,
    cv: req.file.filename,
  };

  // Almacenar la vacante.
  vacante.candidatos.push(nuevoCandidato);
  await vacante.save();

  // Mensaje flash y redirección
  req.flash("correcto", "Se envió correctamente tu Curriculum");
  res.redirect("/");
};

const mostrarCandidatos = async (req, res) => {
  const vacante = await Vacante.findById(req.params.id);

  if (vacante.autor != req.user._id.toString()) {
    return next();
  }

  if (!vacante) return next();

  res.render("candidatos", {
    nombrePagina: `Candidatos Vacante - ${vacante.titulo}`,
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
    candidatos: vacante.candidatos,
  });
};

// Buscador de vacantes.
const buscarVacantes = async (req, res) => {
  const vacantes = await Vacante.find({
    $text: {
      $search: req.body.q,
    },
  }).lean(); //Agregar!

  console.log(req.body.q);
  console.log(vacantes);

  // Mostrar las vacantes
  res.render("home", {
    nombrePagina: `Resultados para la búsqueda : ${req.body.q}`,
    barra: true,
    vacantes,
  });
};

module.exports = {
  formularioNuevaVacante,
  agregarVacante,
  mostrarVacante,
  formEditarVacante,
  editarVacante,
  validarVacante,
  eliminarVacante,
  subirCV,
  contactar,
  mostrarCandidatos,
  buscarVacantes,
};
