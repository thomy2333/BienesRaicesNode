import Propiedad from './Propiedades.js'
import Precio from './Precio.js'
import Categoria from './Categoria.js'
import Usuario from './Usuario.js'
import Mensaje from './Mensaje.js'

//Precio.hasOne(Propiedad)

Propiedad.belongsTo(Precio,{ foreignKey: 'precioId', as: 'precio' })
Propiedad.belongsTo(Categoria, { foreignKey: 'categoriaId', as: 'categoria' })
Propiedad.belongsTo(Usuario, { foreignKey: 'usuarioId' })
Propiedad.hasMany(Mensaje, {foreignKey: 'propiedadId', as: 'mensajes'})

Mensaje.belongsTo(Propiedad, { foreignKey: 'propiedadId'})
Mensaje.belongsTo(Usuario, { foreignKey: 'usuarioId'})

export{
    Propiedad,
    Precio,
    Categoria,
    Usuario,
    Mensaje
}