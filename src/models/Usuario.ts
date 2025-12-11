// src/models/Usuario.ts
import { Model, DataTypes, Optional, HasManyGetAssociationsMixin } from "sequelize";
import sequelize from "../config/database";
import { Emprestimo } from "./Emprestimo";

export interface UsuarioAttributes {
  id: number;
  nome: string;
  email: string;
  senha: string;
  tipo: 'admin' | 'cliente';
}

export interface UsuarioCreationAttributes extends Optional<UsuarioAttributes, "id"> {}

export class Usuario extends Model<UsuarioAttributes, UsuarioCreationAttributes> implements UsuarioAttributes {
  public id!: number;
  public nome!: string;
  public email!: string;
  public senha!: string;
  public tipo!: 'admin' | 'cliente';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Para TypeScript
  public emprestimos?: Emprestimo[];

  // Métodos de associação do Sequelize
  public getEmprestimos!: HasManyGetAssociationsMixin<Emprestimo>;
}

Usuario.init(
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
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    senha: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    tipo: {
      type: DataTypes.ENUM('admin', 'cliente'),
      allowNull: false,
      defaultValue: 'cliente'
    }
  },
  {
    sequelize,
    tableName: "usuarios",
    timestamps: true
  }
);

export default Usuario;