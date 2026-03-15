import { Module } from '@nestjs/common';
import { SpaceController } from './infrastructure/http/controllers/space.controller';
import { ListSpacesUseCase } from './application/use-cases/list-spaces.use-case';
import { GetSpaceByIdUseCase } from './application/use-cases/get-space-by-id.use-case';
import { ListSeatsBySpaceUseCase } from './application/use-cases/list-seats-by-space.use-case';
import { ListEquipementsUseCase } from './application/use-cases/list-equipements.use-case';
import { SpaceRepository } from './infrastructure/repositories/space.repository';
import { EquipementRepository } from './infrastructure/repositories/equipement.repository';
import type { ISpaceRepository } from './domain/repositories/space.repository.interface';
import { SPACE_REPOSITORY } from './domain/repositories/space.repository.interface';
import type { IEquipementLister } from './application/ports/equipement-lister.port';
import { SPACE_EQUIPEMENT_LISTER } from './application/ports/equipement-lister.port';

@Module({
  controllers: [SpaceController],
  providers: [
    {
      provide: SPACE_REPOSITORY,
      useClass: SpaceRepository,
    },
    {
      provide: SPACE_EQUIPEMENT_LISTER,
      useClass: EquipementRepository,
    },
    {
      provide: ListSpacesUseCase,
      useFactory: (spaceRepository: ISpaceRepository) => new ListSpacesUseCase(spaceRepository),
      inject: [SPACE_REPOSITORY],
    },
    {
      provide: GetSpaceByIdUseCase,
      useFactory: (spaceRepository: ISpaceRepository) => new GetSpaceByIdUseCase(spaceRepository),
      inject: [SPACE_REPOSITORY],
    },
    {
      provide: ListSeatsBySpaceUseCase,
      useFactory: (spaceRepository: ISpaceRepository) => new ListSeatsBySpaceUseCase(spaceRepository),
      inject: [SPACE_REPOSITORY],
    },
    {
      provide: ListEquipementsUseCase,
      useFactory: (equipementLister: IEquipementLister) => new ListEquipementsUseCase(equipementLister),
      inject: [SPACE_EQUIPEMENT_LISTER],
    },
  ],
})
export class SpaceModule {}
