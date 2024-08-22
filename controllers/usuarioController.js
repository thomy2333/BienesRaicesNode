import { check, validationResult } from "express-validator"
import bcrypt from 'bcrypt'
import Usuario from "../models/Usuario.js"
import { generarId, generarJWT } from "../helpers/tokens.js"
import { emailRegistro, emailOlvide} from "../helpers/emails.js"

const formularioLogin = (req, res) => {
    res.render('auth/login',{
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken(),
    })
}

const autenticar = async (req, res) =>{
    //validacion
    await check('email').isEmail().withMessage('El Email es Obligatorio').run(req)
    await check('password').notEmpty().withMessage('El Password es Obligatorio').run(req)

    let resultado = validationResult(req)

    //verificar que el resultado este vacio
    if(!resultado.isEmpty()){
        //errores
        return res.render('auth/login',{
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    const { email, password } = req.body

    //comprobar si el usuriaro existe
    const usuario = await Usuario.findOne({ where: { email}})
    if(!usuario){
        return res.render('auth/login',{
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El Usuario no existe'}]
        })
    }

    //comprobar si el usuario esta confirmado
    if(!usuario.confirmado){
        return res.render('auth/login',{
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'Tu cuenta no ha sido confirmada'}]
        }) 
    }

    //revisar el password
    if(!usuario.verificarPassword(password)){
        return res.render('auth/login',{
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El Pasword es incorrecto'}]
        }) 
    }

    //autenticar el usuario
    const token = generarJWT(usuario.id);

    //almacener en un cookie
    return res.cookie('_token', token, {
        httpOnly: true,
        //secure: true,
        //sameSite: true
    }).redirect('/mis-propiedades')
}

const formularioRegistro = (req, res) => {
    res.render('auth/registro',{
        pagina: 'Crear Cuenta',
        csrfToken: req.csrfToken()
    })
}

const registrar = async (req, res) => {
    //Validacion
    await check('nombre').notEmpty().withMessage('El Nombre es Obligatorio').run(req)
    await check('email').isEmail().withMessage('El Email es Obligatorio').run(req)
    await check('password').isLength({ min: 6}).withMessage('El Password debe ser de al menos 6 caracteres').run(req)
    await check('repetir_password').equals(req.body.password).withMessage('Los Passwords no son iguales').run(req)

    let resultado = validationResult(req)

    //verificar que el resultado este vacio
    if(!resultado.isEmpty()){
        //errores
        return res.render('auth/registro',{
            pagina: 'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }

    //extraer los datos
    const {nombre, email, password } = req.body

    //Verificar que el usuario no este duplicado
    const existeUsuario = await Usuario.findOne({ where : {email}})
    if(existeUsuario){
        return res.render('auth/registro',{
            pagina: 'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El Usuario ya esta registrado'}],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }

    //Almacenar el usuario
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId()
    })

    //enviar email
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    //mostrar mensaje de confirmacion
    res.render('template/mensaje',{
        pagina: 'Cuenta Creada Correctamente',
        mensaje: 'Hemos Enviado un Email de Confirmación'
    })
}

//funcion que comprueba una cuenta 
const confirmar = async (req, res) => {
  
    const { token } = req.params

    //verificar si el token es valido
    const usuario = await Usuario.findOne({ where: {token}})

    if(!usuario){
        return  res.render('auth/confirmar-cuenta',{
            pagina: 'Error al confirmar tu cuenta',
            mensaje: 'Hubo un error al confirmar tu cuenta, intenta de nuevo',
            error: true
        })
    }

    //confirmar cuenta
    usuario.token = null;
    usuario.confirmado = true
    await usuario.save()

    res.render('auth/confirmar-cuenta',{
        pagina: 'Cuenta Confirmada',
        mensaje: 'La cuenta se confirmo correctamente'
    })

}

const formularioOlvidePassword = (req, res) => {
    res.render('auth/olvide-password',{
        pagina: 'Recupera tu acceso a Bienes Raices',
        csrfToken: req.csrfToken()
    })
}

const resetPassword = async (req, res) => {
    //Validacion
    await check('email').isEmail().withMessage('El Email es Obligatorio').run(req)
 
    let resultado = validationResult(req)
 
    //verificar que el resultado este vacio
    if(!resultado.isEmpty()){
        //errores
        return res.render('auth/olvide-password',{
            pagina: 'Recupera tu acceso a Bienes Raices',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    //buscar el usuario
    const { email } = req.body

    const usuario = await Usuario.findOne({ where: {email}})

    if(!usuario){
        return res.render('auth/olvide-password',{
            pagina: 'Recupera tu acceso a Bienes Raices',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El email no pertenece a ningún usuario'}]
        })
    }

    //generar un token y enviar el email
    usuario.token = generarId()
    await usuario.save()

    //enviar un email
    emailOlvide({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    })

    //Renderizar mensaje
    res.render('template/mensaje',{
        pagina: 'Restable tu Password',
        mensaje: 'Hemos Enviado un Email con las Intrucciones'
    })
}

const comprobarToken = async (req, res, next) =>{
    
    const { token } = req.params;

    const usuario = await Usuario.findOne({ where: {token}})
    if(!usuario){
        return  res.render('auth/confirmar-cuenta',{
            pagina: 'Reestablece tu password',
            mensaje: 'Hubo un error al validar tu informacion, intenta de nuevo',
            error: true
        })
    }

    //mostrar formulario para modificar el password
    res.render('auth/reset-password', {
        pagina: 'Restablece tu password',
        csrfToken: req.csrfToken()
    })
}

const nuevoPassword = async (req, res) =>{
    //Validacion
    await check('password').isLength({ min: 6}).withMessage('El Password debe ser de al menos 6 caracteres').run(req)
    let resultado = validationResult(req)

    //verificar que el resultado este vacio
    if(!resultado.isEmpty()){
        //errores
        return res.render('auth/reset-password',{
            pagina: 'Reetablece tu Password',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    const { token } = req.params
    const { password } = req.body

    //identificar quien hace el cambio
    const usuario = await Usuario.findOne({ where: {token}})

    //hashear el nuevvo password
    const salt = await bcrypt.genSalt(10)
    usuario.password =  await bcrypt.hash( password, salt)
    usuario.token = null

    await usuario.save()

    res.render('auth/confirmar-cuenta',{
        pagina: 'Password Restablecido',
        mensaje: 'El Password se guardo correctamente',
    })
}

const cerrarSesion = (req, res) => {
    return res.clearCookie('_token').status(200).redirect('/auth/login')
}

export{
    formularioLogin,
    formularioRegistro,
    registrar,
    formularioOlvidePassword,
    confirmar,
    resetPassword,
    comprobarToken,
    nuevoPassword,
    autenticar,
    cerrarSesion
}