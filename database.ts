import { DataSource } from 'typeorm';
import path from 'path';
import { User } from '../entities/User';
import { Shop } from '../entities/Shop';
import { Category } from '../entities/Category';
import { Product } from '../entities/Product';
import { Wish } from '../entities/Wish';
import { ShoppingTrip } from '../entities/ShoppingTrip';
import { TripStop } from '../entities/TripStop';
import { Notification } from '../entities/Notification';

const isDev = process.env.NODE_ENV !== 'production';

// Determine dev vs. compiled by the actual extension of this running file,
// not NODE_ENV: the production Docker image only contains dist/ (no src/),
// and NODE_ENV isn't guaranteed to be set consistently across every
// execution context (e.g. a one-off migration step vs. the web process).
const isCompiled = __filename.endsWith('.js');
const migrationsGlob = path.join(__dirname, '..', 'migrations', isCompiled ? '*.js' : '*.ts');

const connectionOptions = process.env.DATABASE_URL
  ? { url: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'wishlist',
    };

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...connectionOptions,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: isDev,
  entities: [User, Shop, Category, Product, Wish, ShoppingTrip, TripStop, Notification],
  migrations: [migrationsGlob],
});
