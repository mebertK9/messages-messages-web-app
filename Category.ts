import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Product } from './Product';

@Entity('categories')
export class Category {
  @PrimaryColumn('uuid')
  id = uuid();

  @Column('text')
  name!: string;

  // Determines display order in the client's 2x2 category grid.
  @Column('int')
  sortOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}
