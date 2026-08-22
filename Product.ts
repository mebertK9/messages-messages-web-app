import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Shop } from './Shop';
import { Category } from './Category';
import { Wish } from './Wish';

@Entity('products')
export class Product {
  @PrimaryColumn('uuid')
  id = uuid();

  @Column('text')
  name!: string;

  @Column('uuid', { nullable: true })
  preferredShopId?: string;

  @ManyToOne(() => Shop, { onDelete: 'SET NULL', nullable: true, eager: true })
  @JoinColumn({ name: 'preferredShopId' })
  preferredShop?: Shop | null;

  @Column('uuid')
  categoryId!: string;

  // RESTRICT (not SET NULL like preferredShop): categoryId is required, so a
  // category with existing products can't be deleted until they're reassigned.
  @ManyToOne(() => Category, { onDelete: 'RESTRICT', nullable: false, eager: true })
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Wish, (wish) => wish.product)
  wishes!: Wish[];
}
