// src/models/Autor.ts
import { Model, DataTypes, Optional, HasManyGetAssociationsMixin } from "sequelize";
import sequelize from "../config/database";
import { Livro } from "./Livro";

export interface AutorAttributes {
  id: number;
  nome: string;
  biografia: string | null;
  data_nascimento: Date | null;
  nacionalidade: string | null;
}

export interface AutorCreationAttributes extends Optional<AutorAttributes, "id"> {}

export class Autor extends Model<AutorAttributes, AutorCreationAttributes> implements AutorAttributes {
  public id!: number;
  public nome!: string;
  public biografia!: string | null;
  public data_nascimento!: Date | null;
  public nacionalidade!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public livros?: Livro[];

  public getLivros!: HasManyGetAssociationsMixin<Livro>;
}

Autor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    biografia: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    data_nascimento: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    nacionalidade: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: "autores",
    timestamps: true
  }
);

export default Autor;