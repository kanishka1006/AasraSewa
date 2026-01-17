import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  SHELTER_MANAGER = 'SHELTER_MANAGER',
  RESCUER = 'RESCUER',
  CITIZEN = 'CITIZEN',
  VOLUNTEER = 'VOLUNTEER',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: UserRole,
    unique: true,
  })
  name: UserRole;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', default: {} })
  permissions: Record<string, boolean>;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
