import { Model, DataTypes, Optional, BelongsToGetAssociationMixin } from "sequelize";
import sequelize from "../config/database";
import { Usuario } from "./Usuario";
import { Livro } from "./Livro";

export interface EmprestimoAttributes {
  id: number;
  usuario_id: number;
  livro_id: number;
  data_emprestimo: Date;
  data_devolucao_prevista: Date;
  data_devolucao_real: Date | null;
  status: 'ativo' | 'devolvido' | 'atrasado';
}

export interface EmprestimoCreationAttributes extends Optional<EmprestimoAttributes, "id"> {}

export class Emprestimo extends Model<EmprestimoAttributes, EmprestimoCreationAttributes> implements EmprestimoAttributes {
  public id!: number;
  public usuario_id!: number;
  public livro_id!: number;
  public data_emprestimo!: Date;
  public data_devolucao_prevista!: Date;
  public data_devolucao_real!: Date | null;
  public status!: 'ativo' | 'devolvido' | 'atrasado';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public usuario?: Usuario;
  public livro?: Livro;

  public getUsuario!: BelongsToGetAssociationMixin<Usuario>;
  public getLivro!: BelongsToGetAssociationMixin<Livro>;
}

Emprestimo.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    livro_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    data_emprestimo: {
      type: DataTypes.DATE,
      allowNull: false
    },
    data_devolucao_prevista: {
      type: DataTypes.DATE,
      allowNull: false
    },
    data_devolucao_real: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('ativo', 'devolvido', 'atrasado'),
      allowNull: false,
      defaultValue: 'ativo'
    }
  },
  {
    sequelize,
    tableName: "emprestimos",
    timestamps: true
  }
);

export default Emprestimo;