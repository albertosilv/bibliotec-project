// src/models/Categoria.ts
import { Model, DataTypes, Optional, HasManyGetAssociationsMixin } from "sequelize";
import sequelize from "../config/database";
import { Livro } from "./Livro";

export interface CategoriaAttributes {
  id: number;
  nome: string;
  descricao: string | null;
}

export interface CategoriaCreationAttributes extends Optional<CategoriaAttributes, "id"> {}

export class Categoria extends Model<CategoriaAttributes, CategoriaCreationAttributes> implements CategoriaAttributes {
  public id!: number;
  public nome!: string;
  public descricao!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public livros?: Livro[];

  // Métodos de associação do Sequelize
  public getLivros!: HasManyGetAssociationsMixin<Livro>;
}

Categoria.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: "categorias",
    timestamps: true
  }
);

export default Categoria;