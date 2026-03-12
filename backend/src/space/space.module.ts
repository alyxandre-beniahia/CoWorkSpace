import { Module } from '@nestjs/common';
import { SpaceController } from './space.controller';
import { ListSpacesUseCase } from './application/list-spaces.use-case';
import { GetSpaceByIdUseCase } from './application/get-space-by-id.use-case';
import { ListEquipementsUseCase } from './application/list-equipements.use-case';
import { SpaceRepository } from './infrastructure/space.repository';

@Module({
  controllers: [SpaceController],
  providers: [ListSpacesUseCase, GetSpaceByIdUseCase, ListEquipementsUseCase, SpaceRepository],
})
export class SpaceModule {}
