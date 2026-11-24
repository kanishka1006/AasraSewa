import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NetworkController } from './network.controller';
import { NetworkService } from './network.service';
import { Shelter, ShelterSchema } from './shelter.entity';
import { AuditLedger, AuditLedgerSchema } from './audit-ledger.entity';
import { FederatedState, FederatedStateSchema } from './federated-state.entity';
import { SosAlert, SosAlertSchema } from '../database/entities/alert.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        AuthModule,
        MongooseModule.forFeature([
            { name: Shelter.name, schema: ShelterSchema },
            { name: AuditLedger.name, schema: AuditLedgerSchema },
            { name: FederatedState.name, schema: FederatedStateSchema },
            { name: SosAlert.name, schema: SosAlertSchema },
        ]),
    ],
    controllers: [NetworkController],
    providers: [NetworkService],
})
export class NetworkModule { }
