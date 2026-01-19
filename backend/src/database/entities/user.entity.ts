import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    Index,
} from 'typeorm';
import { IsNotEmpty, IsPhoneNumber, IsBoolean } from 'class-validator';
import { Role } from './role.entity';
import { Rental } from './rental.entity';
import { SosAlert } from './alert.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @IsNotEmpty()
    fullName: string;

    @Column({ unique: true })
    @Index()
    @IsPhoneNumber('IN') // Assuming India (+91)
    phoneNumber: string;

    // Storing hashed password
    @Column({ select: false })
    passwordHash: string;

    @Column({ default: true })
    @IsBoolean()
    isSafe: boolean;

    // PostGIS location type
    @Column({
        type: 'geometry',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true,
    })
    @Index({ spatial: true })
    lastKnownLocation: Record<string, any>;

    @Column({ nullable: true })
    fcmToken: string; // Firebase Device Token

    @ManyToOne(() => Role, (role) => role.users, { eager: true })
    role: Role;

    @OneToMany(() => Rental, (rental) => rental.user)
    rentals: Rental[];

    @OneToMany(() => SosAlert, (alert) => alert.victim)
    alerts: SosAlert[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
