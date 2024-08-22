import express from 'express'
import csurf from 'csurf'
import cookieParser from 'cookie-parser'
import usuarioRoutes from './routes/usuarioRoutes.js'
import propiedadesRoutes from './routes/propiedadesRoutes.js'
import appRoutes from './routes/appRoutes.js'
import apiRouter from './routes/apiRoutes.js'
import db from './config/db.js'

//Crear la app
const app = express()

//habilitar lectutas de datos de formularios
app.use( express.urlencoded({extended: true}))

//habilitar cookie parser
app.use(cookieParser())

//habilitar csrf
app.use( csurf({cookie: true}))

//conexion a la base de datos
try {
    await db.authenticate()
    db.sync()
    console.log('Conexion Correcta a la base de datos');
} catch (error) {
    console.log(error);
}
//habilitar pug
app.set('view engine', 'pug')
app.set('views', './views')

//Carpeta Publica
app.use( express.static('public'))

//Routing
app.use('/', appRoutes)
app.use('/auth', usuarioRoutes)
app.use('/', propiedadesRoutes)
app.use('/api', apiRouter)


//Definir el puerto y arrancar el proyecto
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`El Servidor esta funcionando en el puerto ${port}`);
})
