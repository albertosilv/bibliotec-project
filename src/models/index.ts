// src/models/index.ts
import { Usuario } from './Usuario';
import { Livro } from './Livro';
import { Autor } from './Autor';
import { Categoria } from './Categoria';
import { Emprestimo } from './Emprestimo';

Usuario.hasMany(Emprestimo, {
  foreignKey: 'usuario_id',
  as: 'emprestimos'
});

Emprestimo.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario'
});

Livro.hasMany(Emprestimo, {
  foreignKey: 'livro_id',
  as: 'emprestimos'
});

Emprestimo.belongsTo(Livro, {
  foreignKey: 'livro_id',
  as: 'livro'
});

// Categoria 1:N Livro
Categoria.hasMany(Livro, {
  foreignKey: 'categoria_id',
  as: 'livros'
});

Livro.belongsTo(Categoria, {
  foreignKey: 'categoria_id',
  as: 'categoria'
});

Autor.hasMany(Livro, {
  foreignKey: 'autor_id',
  as: 'livros'
});

Livro.belongsTo(Autor, {
  foreignKey: 'autor_id',
  as: 'autor'
});

export {
  Usuario,
  Livro,
  Autor,
  Categoria,
  Emprestimo
};