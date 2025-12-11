// src/models/Livro.ts
import { Model, DataTypes, Optional, HasManyGetAssociationsMixin, BelongsToGetAssociationMixin } from "sequelize";
import sequelize from "../config/database";
import { Emprestimo } from "./Emprestimo";
import { Categoria } from "./Categoria";
import { Autor } from "./Autor";

export interface LivroAttributes {
  id: number;
  titulo: string;
  sinopse: string | null;
  ano_publicacao: number;
  quantidade_disponivel: number;
  categoria_id: number;
  autor_id: number;
}

export interface LivroCreationAttributes extends Optional<LivroAttributes, "id"> {}

export class Livro extends Model<LivroAttributes, LivroCreationAttributes> implements LivroAttributes {
  public id!: number;
  public titulo!: string;
  public sinopse!: string | null;
  public ano_publicacao!: number;
  public quantidade_disponivel!: number;
  public categoria_id!: number;
  public autor_id!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Para TypeScript
  public emprestimos?: Emprestimo[];
  public categoria?: Categoria;
  public autor?: Autor;

  // Métodos de associação do Sequelize
  public getEmprestimos!: HasManyGetAssociationsMixin<Emprestimo>;
  public getCategoria!: BelongsToGetAssociationMixin<Categoria>;
  public getAutor!: BelongsToGetAssociationMixin<Autor>;
}

Livro.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    sinopse: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ano_publicacao: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantidade_disponivel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    categoria_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    autor_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: "livros",
    timestamps: true
  }
);

export default Livro;